class UploadsHandler {
  constructor(storageService, AlbumsService, validator) {
    this._storageService = storageService;
    this._albumsService = AlbumsService;
    this._validator = validator;

    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }

  async postUploadImageHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;

    if (!cover) {
      return h
        .response({
          status: "fail",
          message: "Berkas tidak ditemukan dalam payload",
        })
        .code(400);
    }

    this._validator.validateImageHeaders(cover.hapi.headers);

    // Simpan file ke StorageService
    const filename = await this._storageService.writeFile(cover, cover.hapi);

    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/uploads/images/${filename}`; //upload menggunakan s

    // Perbarui database
    await this._albumsService.updateAlbumCover(id, fileLocation);

    return h
      .response({
        status: "success",
        message: "Sampul berhasil diunggah",
        data: { cover: fileLocation },
      })
      .code(201);
  }
}

module.exports = UploadsHandler;
