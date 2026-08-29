import { initializeApp } from "firebase/app";
import { getDataConnect } from "firebase/data-connect";
import { connectorConfig, listTrainings } from "./generated.js?v=28";
import { firebaseConfig } from "./config.js?v=17";

const dc = getDataConnect(initializeApp(firebaseConfig), connectorConfig);

async function loadOptions() {
  const response = await listTrainings(
    dc,
    { limit: 1000 },
    { fetchPolicy: "SERVER_ONLY" },
  );
  const trainings = response.data.trainings || [];
  const eventTypes = [...new Set(
    trainings
      .map((training) => String(training.eventType || "研修会").trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, "ja"));

  return {
    trainings,
    eventTypes: eventTypes.length ? eventTypes : ["研修会"],
  };
}

window.sqlAnnualStats = { loadOptions };
window.dispatchEvent(new Event("sql-annual-stats-ready"));
