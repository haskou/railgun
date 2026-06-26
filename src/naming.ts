export type NameSet = {
  readonly camel: string;
  readonly kebab: string;
  readonly pascal: string;
};

export function names(raw: string): NameSet {
  const parts = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const pascal = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return {
    camel: pascal.charAt(0).toLowerCase() + pascal.slice(1),
    kebab: parts.map((part) => part.toLowerCase()).join("-"),
    pascal,
  };
}

export function basename(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? "app";
}
