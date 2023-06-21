/* 
const redisClient = createClient();
await redisClient.connect();

try {
  await redisClient.ft.create(
    "idx:users",
    {
      "$.isBlocked": {
        type: SchemaFieldTypes.TEXT,
        SORTABLE: true,
      },
      "$.isSubscribed": {
        type: SchemaFieldTypes.TEXT,
        AS: "city",
      },
      "$.calls": {
        type: SchemaFieldTypes.NUMERIC,
        AS: "age",
      },
    },
    {
      ON: "JSON",
      PREFIX: "user:",
    }
  );
} catch (e) {
  if (e.message === "Index already exists") {
    console.log("Index exists already, skipped creation.");
  } else {
    // Something went wrong, perhaps RediSearch isn't installed...
    console.error(e);
    process.exit(1);
  }
}
 */