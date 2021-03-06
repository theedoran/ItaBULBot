import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { bulApi } from "./src/api.js";

// Get current file path.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Directory for fetched JSONs.
const JSON_PATH = path.join(__dirname, "json");

// Create dir if its doesn't exist.
if (!fs.existsSync(JSON_PATH)) {
  fs.mkdirSync(JSON_PATH);
}

(async () => {
  try {
    // Fetch region IDs.
    let { data: regions } = await bulApi("/regions");

    regions = regions.map((r) => ({
      id: r.region_id,
      name: r.region_name,
    }));

    // Write regions to JSON.
    fs.writeFileSync(
      `${JSON_PATH}/regions.json`,
      JSON.stringify(regions, null, 2),
      { flag: "w" },
    );

    console.log("Successfully wrote regions to file!");

    // Initialize cities array.
    let allCities = [];

    for (let r of regions) {
      // Get cities for the region.
      const { data: citiesData } = await bulApi(`/region/${r.id}/cities`);

      allCities.push(
        ...citiesData.map((c) => ({
          id: c.city_id,
          name: c.city_name,
          region_name: r.name,
        })),
      );
    }

    // Write regions to JSON.
    fs.writeFileSync(
      `${JSON_PATH}/cities.json`,
      JSON.stringify(allCities, null, 2),
      { flag: "w" },
    );

    console.log("Successfully wrote cities to file!");
  } catch (e) {
    console.error(e.message);
  }
})();
