const Sauce = require('../models/Sauces');
const fs =require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
  { 
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
  .then(sauce => {
    const filename = sauce.imageUrl.split('/images/')[1];
    fs.unlink(`images/${filename}`, () => {
      Sauce.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
    .catch(error => res.status(400).json({ error }));
    });
  })
  .catch(error => res.status(500).json({ error }))
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }));
};


exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(400).json({ error }));
};

exports.likeDislikeSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id})
  .then((sauce) => {
    //modification suite soutenance pour mettre un controle sur le user ID lors du likes ou dislikes (correctif soutenance)
    //si l'utilisateur clic sur likes et qu'il est pas connu dans likes
    if (req.body.like === 1 && !sauce.usersLiked.includes(req.body.userId)) {    
      Sauce.updateOne({_id: req.params.id}, { $inc: {likes: 1}, $push: {usersLiked: req.body.userId}}, {_id: req.params.id})
        .then(() => res.status(200).json({message: 'Ajout du likes !'}))
        .catch(error => res.status(400).json({error}));
    //sinon si l'utilisateur clic sur dislikes et qu'il est pas connu dans dislikes
    } else if (req.body.like === -1 && !sauce.usersDisliked.includes(req.body.userId)) {  
        Sauce.updateOne({_id: req.params.id}, { $inc: {dislikes: 1}, $push: {usersDisliked: req.body.userId}}, {_id: req.params.id})
          .then(() => res.status(200).json({message: 'Ajout du dislikes !'}))
          .catch(error => res.status(400).json({error}));
    //Si l'utilisateur re-clic sur likes ou dislikes pour annuler son vote
    } else if (req.body.like === 0) {  
        //suppression de l'id du user dans la BD usersLiked et on enlève 1 au compteur des likes     
        if (sauce.usersLiked.includes(req.body.userId)) {
          Sauce.updateOne({_id: req.params.id}, {$inc: {likes: -1}, $pull: {usersLiked: req.body.userId}}, {_id: req.params.id})
            .then(() => res.status(200).json({message: 'Suppression du likes !'}))
            .catch(error => res.status(400).json({error}));
        //suppression de l'id du user dans la BD usersDisliked et on enlève 1 au compteur des dislikes
        } else if (sauce.usersDisliked.includes(req.body.userId)) {
            Sauce.updateOne({_id: req.params.id}, { $inc: {dislikes: -1}, $pull: {usersDisliked: req.body.userId}}, {_id: req.params.id})
              .then(() => res.status(200).json({message: 'Suppression du dislikes !'}))
              .catch(error => res.status(400).json({error}));
        }
    }
  })
  .catch(error => {res.status(400).json({error});});
};