const fs = require("fs");
const path = require("path");

class StorageService {
  constructor(folder) {
    this._folder = folder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const filename = `${+new Date()}-${meta.filename}`;
    const filePath = path.join(this._folder, filename);
    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      file.pipe(fileStream);

      file.on("end", () => {
        fileStream.end(); // Menutup stream setelah selesai
        resolve(filename); // Mengembalikan nama file, bukan path lengkap
      });

      file.on("error", (err) => {
        fileStream.end();
        reject(err);
      });
    });
  }
}

module.exports = StorageService;
