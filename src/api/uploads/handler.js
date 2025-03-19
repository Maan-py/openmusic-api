class UploadsHandler {
  constructor(storageService, albumsService, validator) {
    this.storageService = storageService;
    this.albumsService = albumsService;
    this.validator = validator;
  }

  async postUploadImageHandler(request, h) {
    const { cover: data } = request.payload;
    const { id: albumId } = request.params;

    if (!data) {
      return h
        .response({
          status: "fail",
          message: "Gambar harus dikirim",
        })
        .code(400);
    }

    try {
      this.validator.validateImageHeaders(data.hapi.headers);

      const MAX_FILE_SIZE = 512 * 1024; // 512KB

      if (data._data.length > MAX_FILE_SIZE) {
        return h
          .response({
            status: "fail",
            message: "Ukuran file terlalu besar. Maksimal 512KB.",
          })
          .code(413); 
      }

      const filename = await this.storageService.writeFile(data, data.hapi.filename);
      const filePath = filename;

      await this.albumsService.updateAlbumCover(albumId, filePath);

      return h
        .response({
          status: "success",
          message: "Berhasil menambahkan cover album",
          data: { fileLocation: filePath },
        })
        .code(201);
    } catch (error) {
      console.error("Error saat mengupload gambar:", error);
      return h
        .response({
          status: "fail",
          message: "Tipe file tidak didukung. Hanya gambar yang diperbolehkan.",
        })
        .code(400);
    }
  }
}

module.exports = UploadsHandler;
