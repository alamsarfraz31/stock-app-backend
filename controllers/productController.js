const { request } = require("express");
const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

// Create Product
const createProduct = asyncHandler (async (req, res)=>{
    //res.send("Product Created")
    const {name, sku, category,  quantity, price, description} = req.body

    // Validation
    if (!name || !category || !quantity || !price || !description) {
        res.status(400)
        throw new Error("Please fill in all fields")
    }

    // Handle Image Upload
    let fileData = {}
    if (req.file) {
        // Save Image to Cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Stock", resource_type: "image"})
        } catch (error) {
            res.status(500);
            throw new Error("Image Could not be Uploaded.")
        }
        fileData = {
            fileName: req.file.originalname, 
            filePath: uploadedFile.secure_url, 
            fileType: req.file.mimetype, 
            fileSize: fileSizeFormatter(req.file.size, 2) , 
        }
    }
    
    // Creat Product
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: fileData,

    });


    res.status(201).json(product)

});

// Get All Product
const getProducts = asyncHandler (async (req, res)=>{
    //res.send("Get Products")
    const products = await Product.find({user: req.user.id}).sort("-CreateAt")
    res.status(200).json(products)
});

// Get Single Product
const getProduct = asyncHandler (async (req, res)=>{
    //res.send("Single Product")
    const product = await Product.findById(req.params.id)
    // If Product does not Exist
    if (!product){
        res.status(404)
        throw new Error("Product not Found")
    }

    // Match Product to its User
    if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("user not Authorized")
    }
    res.status(200).json(product);

});

// Delete Product
const deleteProduct = asyncHandler (async (req, res)=>{
    //res.send("Single Product")
    const product = await Product.findById(req.params.id)
    // If Product does not Exist
     

    // Match Product to its User
    if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("user not Authorized")
    }
    await product.remove()
    res.status(200).json({message: "Product Deleted Successfuly"});

});

// Update Product
const updateProduct = asyncHandler (async (req, res)=>{
    //res.send("Product Created")
    const {name, sku, category,  quantity, price, description} = req.body;
    const {id} = req.params

    const product = await Product.findById(req.params.id)
    // If Product does not Exist
    if (!product){
        res.status(404)
        throw new Error("Product not Found")
    }

    // Match Product to its User
    if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("user not Authorized")
    }
    
    // Handle Image Upload
    let fileData = {}
    if (req.file) {
        // Save Image to Cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Stock", resource_type: "image"})
        } catch (error) {
            res.status(500);
            throw new Error("Image Could not be Uploaded.")
        }
        fileData = {
            fileName: req.file.originalname, 
            filePath: uploadedFile.secure_url, 
            fileType: req.file.mimetype, 
            fileSize: fileSizeFormatter(req.file.size, 2) , 
        }
    }
    
    // Update Product
    const updatedProduct = await Product.findByIdAndUpdate(
        {_id: id},
        {
            name,
            category,
            quantity,
            price,
            description,
            image: Object.keys(fileData).length === 0 ? product?.image : fileData,
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json(updatedProduct)

});

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct,
}