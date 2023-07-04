const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const fs = require("fs");
const path = require("path");

const createDoc = async (contentBody, chatID, timestamp) => {
  const name = contentBody.slice(26, 51);
  // Load the docx file as binary content
  const content = fs.readFileSync(
    path.resolve(__dirname, "input.docx"),
    "binary"
  );

  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    body_text: contentBody,
  });

  const buf = doc.getZip().generate({
    type: "nodebuffer",
    // compression: DEFLATE adds a compression step.
    // For a 50MB output document, expect 500ms additional CPU time
    compression: "DEFLATE",
  });

  // buf is a nodejs Buffer, you can either write it to a
  // file or res.send it with express for example.
  fs.writeFileSync(
    path.resolve(
      __dirname,
      `../../assets/${name}_${timestamp}_createdbyAskMe.docx`
    ),
    buf
  ); //the filename identies the chatID to originate the message ant he time stap

  return path.resolve(
    __dirname,
    `../../assets/${name}_${timestamp}_createdbyAskMe.docx`
  );
};
module.exports = createDoc;
