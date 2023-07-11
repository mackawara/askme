const fs = require("fs");
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser();
const parsePdfToJson = (pdfFilepath, jsonOutput) => {
  pdfParser.on("pdfParser_dataError", (errData) =>
    console.error(errData.parserError)
  );
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    fs.writeFile(jsonOutput, JSON.stringify(pdfData), (err) => {
      if (err) throw err;
      console.log("The file has been saved!");
    });
  });

  pdfParser.loadPDF(pdfFilepath);
};
module.exports = parsePdfToJson;
