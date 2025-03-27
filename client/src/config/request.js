const URL = import.meta.env.VITE_API_URL;

const request = {
  allData: `${URL}/entries`,
  projects: `${URL}/projects`,
  projectDetails: (id) => `${URL}/projects/${id}`,
};

export default request;
