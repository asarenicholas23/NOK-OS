import React from "react";

/** Renders one schema.org structured-data block. */
export const JsonLd: React.FC<{ data: object }> = ({ data }) => (
  <script type="application/ld+json">{JSON.stringify(data).replace(/</g, "\\u003c")}</script>
);
