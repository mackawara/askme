const { MongoClient } = require('mongodb');

async function recoverDeletedDocument() {
  const uri = "mongodb+srv://mkawara:qZaonL2J5rsVXUHP@staging.qo0ougf.mongodb.net/?retryWrites=true&w=majority"
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    const database = client.db('local'); // Use the 'local' database where the oplog is stored
    const oplog = database.collection('oplog.rs'); // Oplog collection

    // Define the criteria to find the delete operation you want to recover
    const filter = {
      op: 'd', // 'd' represents delete operation in the oplog
      ns: 'test.users',
      // Add additional filters as needed to pinpoint the specific delete operation
    };

    // Find the delete operation in the oplog
    const deleteOperation = await oplog.findOne(filter);

    if (deleteOperation) {
      // Extract the deleted document from the operation
      const deletedDocument = deleteOperation.o;

      // Connect to your application's database
      const appDatabase = client.db('test');
      const collection = appDatabase.collection('users');

      // Insert the recovered document back into the collection
      const result = await collection.insertOne(deletedDocument);

      console.log(`Recovered deleted document with _id: ${result.insertedId}`);
    } else {
      console.log('Delete operation not found in the oplog.');
    }
  } finally {
    await client.close();
  }
}
module.exports=recoverDeletedDocument
//recoverDeletedDocument().catch(console.error);
