"use strict";

const GetCupcakeCollections =
    require(
        "@cupcake/services/cupcakeCollection/GetCupcakeCollections"
    );

const GetCupcakesByCollection =
    require(
        "@cupcake/services/cupcakeCollection/GetCupcakesByCollection"
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
    GetCupcakesByCollection,
    CreateCupcakeCollection,
    SaveCupcakeCollection
};