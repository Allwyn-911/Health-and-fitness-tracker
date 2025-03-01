import { Request, Response } from "express";
import Cart from "../../models/shoppingModel/cartModel";
import Product from "../../models/shoppingModel/productModel";

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Find or create a cart
    let cart = await Cart.findOne();
    if (!cart) {
      cart = new Cart({ items: [] });
    }

    // Check if the product already exists in the cart
    const existingItem = cart.items.find(
      (items) => items.product_id.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.Price = product.price.discounted;
    } else {
      cart.items.push({
        product_id: productId,
        quantity,
        cart_image: product.image,
        Price: product.price.discounted,
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Failed to add item to cart", error });
  }
};

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const cart = await Cart.findOne().populate("items.product_id");

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cart", error });
  }
};

export const updateCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const cartid = req.params.id;
  try {
    const updatedData = req.body;

    const updatedCart = await Cart.findByIdAndUpdate(cartid, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    res.status(200).json({
      message: "Cart updated successfully",
      cart: updatedCart,
    });
  } catch (error) {
    res.status(400).json({ message: "Failed to update cart", error });
  }
};

// ✅ Update Cart Quantity
export const updateCartQuantity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Find the cart
    let cart = await Cart.findOne();
    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    // Find the item inside the cart
    const item = cart.items.find(
      (item) => item.product_id.toString() === productId
    );

    if (!item) {
      res.status(404).json({ message: "Product not found in cart" });
      return;
    }

    // Update the quantity
    item.quantity = quantity;

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update cart item", error });
  }
};

// ✅ Delete Entire Cart
export const deleteCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const cartid = req.params.id;

  try {
    const deletedCart = await Cart.findByIdAndDelete(cartid);

    if (!deletedCart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    res.status(200).json({
      message: "Cart deleted successfully",
      cart: deletedCart,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete cart", error });
  }
};

// ✅ Delete Single Cart Item
export const deleteCartItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { cartItemId } = req.params;

  try {
    // Find the cart
    const cart = await Cart.findOne();
    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    // Find the index of the item to be removed
    const itemIndex = cart.items.findIndex(
      (item) => item.product_id.toString() === cartItemId
    );

    if (itemIndex === -1) {
      res.status(404).json({ message: "Item not found in cart" });
      return;
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Recalculate the total price
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.Price * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Item deleted successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete item from cart", error });
  }
};
