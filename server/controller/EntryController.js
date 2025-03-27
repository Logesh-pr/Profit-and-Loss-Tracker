import Entry from "../model/EntryModel.js";
import { validationResult } from "express-validator";

/**
 * Get all entries with optional filtering
 */
const getEntries = async (req, res) => {
  try {
    const { projectId, type, startDate, endDate } = req.query;

    // Build query based on filters
    let query = {};

    if (projectId) {
      query.projectId = projectId;
    }

    if (type) {
      query["entries.type"] = type;
    }

    // Date range filtering - improved to handle nested entries correctly
    if (startDate || endDate) {
      // Create date objects
      const startDateTime = startDate ? new Date(startDate) : null;
      const endDateTime = endDate ? new Date(endDate) : null;

      if (startDateTime) {
        // Set start time to beginning of day
        startDateTime.setHours(0, 0, 0, 0);
      }

      if (endDateTime) {
        // Set end time to end of day
        endDateTime.setHours(23, 59, 59, 999);
      }

      // Ensure we're using proper date objects
      if (startDateTime && !isNaN(startDateTime.getTime())) {
        if (!query["$or"]) query["$or"] = [];

        // Match entries where the nested entry date is >= startDate
        query["$or"].push({
          "entries.date": { $gte: startDateTime },
        });

        // Or match entries where the top-level date is >= startDate and nested entry has no date
        query["$or"].push({
          date: { $gte: startDateTime },
          entries: {
            $elemMatch: {
              date: { $exists: false },
            },
          },
        });
      }

      if (endDateTime && !isNaN(endDateTime.getTime())) {
        if (!query["$and"]) query["$and"] = [];

        // Match entries where either:
        query["$and"].push({
          $or: [
            // The nested entry date is <= endDate
            { "entries.date": { $lte: endDateTime } },
            // Or the top-level date is <= endDate and nested entry has no date
            {
              date: { $lte: endDateTime },
              entries: {
                $elemMatch: {
                  date: { $exists: false },
                },
              },
            },
          ],
        });
      }
    }

    const entries = await Entry.find(query).sort({ createdAt: -1 });

    // Process entries to include top-level dates for entries that don't have their own dates
    const processedEntries = entries.map((entry) => {
      const entryCopy = entry.toObject();
      entryCopy.entries = entryCopy.entries.map((item) => {
        if (!item.date) {
          return { ...item, date: entry.date };
        }
        return item;
      });
      return entryCopy;
    });

    res.status(200).json({
      success: true,
      count: processedEntries.length,
      data: processedEntries,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get entries for a specific project
 */
const getProjectEntries = async (req, res) => {
  try {
    const { projectId } = req.params;

    const entries = await Entry.find({ projectId }).sort({ createdAt: -1 });

    // Calculate income and expense totals
    let incomeTotal = 0;
    let expenseTotal = 0;

    // Flatten all entries for easier processing
    const flattenedEntries = [];

    entries.forEach((entryDoc) => {
      entryDoc.entries.forEach((item, index) => {
        if (item.type === "income") {
          incomeTotal += item.cost;
        } else if (item.type === "expenses") {
          expenseTotal += item.cost;
        }

        flattenedEntries.push({
          id: entryDoc._id,
          entryId: entryDoc._id,
          entryIndex: index,
          description: item.description,
          type: item.type,
          amount: item.cost,
          date: item.date || entryDoc.date,
          createdAt: entryDoc.createdAt,
          updateat: item.updateat || entryDoc.updatedat,
        });
      });
    });

    res.status(200).json({
      success: true,
      count: flattenedEntries.length,
      data: entries,
      flattenedEntries: flattenedEntries,
      summary: {
        income: incomeTotal,
        expense: expenseTotal,
        net: incomeTotal - expenseTotal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new entry
 */
const createEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { entries, projectId, date } = req.body;

    // Default entry date (fallback)
    const entryDate = date ? new Date(date) : new Date();

    // Validate the date is valid
    if (isNaN(entryDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Create new entry
    const newEntry = new Entry({
      entries: entries.map((item) => {
        // Use item's date if provided, otherwise use the entry date
        let itemDate = item.date ? new Date(item.date) : entryDate;

        // Additional validation to ensure date is valid
        if (isNaN(itemDate.getTime())) {
          itemDate = entryDate;
        }

        return {
          description: item.description,
          type: item.type,
          cost: item.cost,
          date: itemDate,
          updateat: new Date(),
        };
      }),
      projectId,
      date: entryDate,
      updatedat: new Date(),
    });

    const savedEntry = await newEntry.save();

    res.status(201).json({
      success: true,
      data: savedEntry,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new entry for a specific project or add to existing one
 */
const createProjectEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId } = req.params;

    // Get the entries data
    const { entries, date } = req.body;

    // Validate that entries is an array with at least one item
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        message: "At least one entry item is required",
      });
    }

    // Find existing entry document for this project
    let entryDoc = await Entry.findOne({ projectId });

    if (entryDoc) {
      // Add new entries to the existing document
      const newEntries = entries.map((item) => ({
        description: item.description,
        type: item.type,
        cost: item.cost,
        date: item.date || date || new Date(),
        updateat: new Date(),
      }));

      entryDoc.entries.push(...newEntries);
      entryDoc.updatedat = new Date();

      const savedEntry = await entryDoc.save();

      res.status(200).json({
        success: true,
        message: "Entry updated successfully",
        data: savedEntry,
      });
    } else {
      // Create new entry document if none exists
      const newEntry = new Entry({
        entries: entries.map((item) => ({
          description: item.description,
          type: item.type,
          cost: item.cost,
          date: item.date || date || new Date(),
          updateat: new Date(),
        })),
        projectId,
        date: date || new Date(),
        updatedat: new Date(),
      });

      const savedEntry = await newEntry.save();

      res.status(201).json({
        success: true,
        message: "Entry added successfully",
        data: savedEntry,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an entry
 */
const updateEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Filter out projectId validation errors for update operations
    const relevantErrors = errors
      .array()
      .filter(
        (error) =>
          error.path !== "projectId" ||
          (error.path === "projectId" && req.body.projectId !== undefined)
      );

    if (relevantErrors.length > 0) {
      return res.status(400).json({ errors: relevantErrors });
    }
  }

  try {
    const { id } = req.params;
    const { entries, entryIndex, date, projectId } = req.body;

    // Find entry document
    const entryDoc = await Entry.findById(id);

    if (!entryDoc) {
      return res.status(404).json({ message: "Entry not found" });
    }

    // Update specific entry in the entries array if index is provided
    if (entryIndex !== undefined && entries && entries.length > 0) {
      // Parse the entryIndex if it's a string
      const index =
        typeof entryIndex === "string" ? parseInt(entryIndex, 10) : entryIndex;

      if (isNaN(index)) {
        return res
          .status(400)
          .json({ message: "Invalid entry index: not a number" });
      }

      if (index < 0 || index >= entryDoc.entries.length) {
        return res.status(400).json({
          message: `Invalid entry index: ${index} is out of bounds (max: ${
            entryDoc.entries.length - 1
          })`,
        });
      }

      // Update the specific entry at the given index
      entryDoc.entries[index] = {
        description: entries[0].description,
        type: entries[0].type,
        cost: entries[0].cost,
        date: entries[0].date || new Date(),
        updateat: new Date(),
      };
    }
    // Replace entire entries array if no index is specified
    else if (entries && Array.isArray(entries)) {
      entryDoc.entries = entries.map((item) => ({
        description: item.description,
        type: item.type,
        cost: item.cost,
        date: item.date || date || new Date(),
        updateat: new Date(),
      }));
    } else {
      return res
        .status(400)
        .json({ message: "No valid entries data provided" });
    }

    if (date) {
      entryDoc.date = date;
    }

    // Only update projectId if it's provided (should be rare for updates)
    if (projectId) {
      entryDoc.projectId = projectId;
    }

    entryDoc.updatedat = new Date();

    const updatedEntry = await entryDoc.save();

    res.status(200).json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ID format",
        error: error.message,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete an entry or a specific transaction within an entry
 */
const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { entryIndex } = req.query; // Get the entry index from query params

    const entryDoc = await Entry.findById(id);

    if (!entryDoc) {
      return res.status(404).json({ message: "Entry not found" });
    }

    // If entryIndex is provided, remove just that entry from the array
    if (entryIndex !== undefined) {
      const index = parseInt(entryIndex, 10);

      if (isNaN(index) || index < 0 || index >= entryDoc.entries.length) {
        return res.status(400).json({ message: "Invalid entry index" });
      }

      // Remove the specific entry from the array
      entryDoc.entries.splice(index, 1);

      // If there are still entries, save the document
      if (entryDoc.entries.length > 0) {
        entryDoc.updatedat = new Date();
        await entryDoc.save();

        return res.status(200).json({
          success: true,
          message: "Transaction deleted successfully",
        });
      }

      // If no entries left, delete the whole document
    }

    // Delete the entire entry document
    await Entry.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export {
  getEntries,
  getProjectEntries,
  createEntry,
  createProjectEntry,
  updateEntry,
  deleteEntry,
};
