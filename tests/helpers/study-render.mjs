import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export async function createStudyRenderer(vite) {
  const { StudyRecordsProvider } = await vite.ssrLoadModule(
    "/components/atlas/study-records.tsx",
  );
  return (element) =>
    renderToStaticMarkup(
      React.createElement(StudyRecordsProvider, null, element),
    );
}
