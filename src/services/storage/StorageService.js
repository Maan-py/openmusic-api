const fs = require("fs");
const path = require("path");

class StorageService {
  constructor(folder) {
    this._folder = folder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, filename) {
    const filePath = path.join(this._folder, filename);
    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      file.pipe(fileStream);
      file.on("end", () => {
        resolve(filePath);
      });
      file.on("error", (err) => {
        reject(err);
      });
    });
  }
}

module.exports = StorageService;
