import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../model/ProjectModel.js";
import Entry from "../model/EntryModel.js";

// Load environment variables
dotenv.config();

// Define the old PnLEntry schema (since we'll eventually remove the model file)
const PnLEntrySchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    type: { type: String, required: true },
    cost: { type: Number, required: true },
    date: { type: Date, required: true },
    project: { type: String, required: true },
  },
  { timestamps: true }
);

const PnLEntry = mongoose.model("PnLEntry", PnLEntrySchema);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB for migration"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function migrateData() {
  try {
    // Fetch all PnL entries
    const pnlEntries = await PnLEntry.find({});
    console.log(`Found ${pnlEntries.length} PnL entries to migrate`);

    // Fetch all projects to get their IDs by name
    const projects = await Project.find({});
    const projectMap = {};

    // Create a map of project names to project IDs
    projects.forEach((project) => {
      projectMap[project.name] = project._id;
    });

    let migratedCount = 0;
    let skippedCount = 0;

    // Process each PnL entry
    for (const pnl of pnlEntries) {
      // Skip if no project found
      if (!projectMap[pnl.project]) {
        console.log(`Skipping entry for unknown project: ${pnl.project}`);
        skippedCount++;
        continue;
      }

      // Check if we already have an Entry with this description and date
      // (to avoid duplicating data if the script is run multiple times)
      const existingEntry = await Entry.findOne({
        description: pnl.description,
        date: pnl.date,
        projectId: projectMap[pnl.project],
      });

      if (existingEntry) {
        console.log(
          `Entry already exists for: ${pnl.description} on ${pnl.date}`
        );

        // Check if this specific entry item already exists
        let entryExists = false;
        for (const item of existingEntry.entry) {
          if (
            item.type ===
              (pnl.type === "inbound"
                ? "Income"
                : pnl.type === "outbound"
                ? "Expense"
                : pnl.type) &&
            item.cost === pnl.cost
          ) {
            entryExists = true;
            break;
          }
        }

        if (!entryExists) {
          // Add to existing entry array if not found
          existingEntry.entry.push({
            type:
              pnl.type === "inbound"
                ? "Income"
                : pnl.type === "outbound"
                ? "Expense"
                : pnl.type,
            cost: pnl.cost,
          });
          await existingEntry.save();
          console.log(`Added new item to existing entry: ${pnl.description}`);
          migratedCount++;
        } else {
          console.log(`Skipping duplicate entry item for: ${pnl.description}`);
          skippedCount++;
        }
      } else {
        // Create a new Entry document
        const newEntry = new Entry({
          description: pnl.description,
          entry: [
            {
              type:
                pnl.type === "inbound"
                  ? "Income"
                  : pnl.type === "outbound"
                  ? "Expense"
                  : pnl.type,
              cost: pnl.cost,
            },
          ],
          date: pnl.date,
          projectId: projectMap[pnl.project],
        });

        await newEntry.save();
        console.log(`Migrated: ${pnl.description} for project ${pnl.project}`);
        migratedCount++;
      }
    }

    console.log("Migration completed:");
    console.log(`  Migrated: ${migratedCount}`);
    console.log(`  Skipped: ${skippedCount}`);

    console.log(
      "\nYou can now safely remove the PnLEntryModel.js file and any references to it."
    );
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

migrateData();
