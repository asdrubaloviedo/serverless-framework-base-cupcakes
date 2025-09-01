const { GetAllNameImageCountFestivity } = require('@festivity/services/festivity');

class FestivityController {

  static async getAllNameImageCount(email) {
    return GetAllNameImageCountFestivity.execute(email);
  };
}

module.exports = FestivityController;
