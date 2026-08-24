"use strict";

const GetCupcakeCollections =
    require(
        "@cupcake/services/cupcakeCollection/GetCupcakeCollections"
    );

const CreateCupcakeCollection =
    require(
        "@cupcake/services/cupcakeCollection/CreateCupcakeCollection"
    );

const SaveCupcakeCollection =
    require(
        "@cupcake/services/cupcakeCollection/SaveCupcakeCollection"
    );

module.exports = {
    GetCupcakeCollections,
    CreateCupcakeCollection,
    SaveCupcakeCollection
};