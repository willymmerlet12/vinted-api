const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");

const User = require("../models/User");
const Offer = require("../models/Offer");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.fields);
    // console.log(req.files.picture.path);

    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;

    // Créer une nouvelle annonce (sans image)
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });

    // console.log(newOffer);

    // Envoi de l'image à cloudinary
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: `/vinted/offers/${newOffer._id}`,
    });
    // console.log(result);
    // Ajoute result à product_image
    newOffer.product_image = result;

    // Sauvegarder l'annonce
    await newOffer.save();
    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, page, sort } = req.query;
    let filters = {};
    let limit = Number(req.query.limit);
    const skip = (page - 1) * limit;
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = {
        $gte: priceMin,
      };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = {
          $lte: priceMax,
        };
      }
    }
    let sort1 = {};
    if (sort === "price-desc") {
      sort1 = { product_price: -1 };
    } else if (sort === "price-asc") {
      sort1 = { product_price: 1 };
    }
    let page1;
    if (Number(page) < 1) {
      page1 = 1;
    } else {
      page1 = Number(page);
    }
    const offers = await Offer.find(filters)
      .select("product_name product_price")
      .sort(sort1)
      .limit(limit)
      .skip(skip);
    res.status(200).json(offers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account _id",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
