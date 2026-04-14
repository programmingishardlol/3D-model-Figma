import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { DesignDocument } from "@figma-3d/shared";

const serverSourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(serverSourceDirectory, "../.data/rooms");

function ensureDataDirectory() {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

function documentPath(documentId: string) {
  const safeName = Buffer.from(documentId).toString("base64url");
  return path.join(dataDirectory, `${safeName}.json`);
}

export function loadPersistedDocument(documentId: string): DesignDocument | null {
  const filePath = documentPath(documentId);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const serialized = fs.readFileSync(filePath, "utf8");
  return JSON.parse(serialized) as DesignDocument;
}

export function savePersistedDocument(document: DesignDocument) {
  ensureDataDirectory();
  fs.writeFileSync(documentPath(document.id), JSON.stringify(document, null, 2), "utf8");
}

export function persistedDocumentDirectory() {
  return dataDirectory;
}
