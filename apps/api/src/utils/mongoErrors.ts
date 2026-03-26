const isMongoDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
};

const isMongoCastError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    error.kind === "ObjectId"
  );
};

export { isMongoCastError, isMongoDuplicateKeyError };
