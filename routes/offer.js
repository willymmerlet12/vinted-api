const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");

const User = require("../models/User");
const Offer = require("../models/Offer");
const { count } = require("../models/User");

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
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    // création d'un objet dans lequel on va sotcker nos différents filtres
    let filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }
    let sort = {};
    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }
    let page;
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }
    let limit = Number(req.query.limit);
    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit) // ignorer les x résultats
      .limit(limit); // renvoyer y résultats
    // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
    const count = await Offer.countDocuments(filters);
    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
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
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
