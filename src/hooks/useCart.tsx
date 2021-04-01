import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
        const updatedCart = [...cart];
        const productExistsOnTheCart = updatedCart.find(product => product.id === productId);

        const amount = (productExistsOnTheCart ? productExistsOnTheCart.amount : 0) + 1;

        const stockResponse = await api.get(`stock/${productId}`);
        if (amount > stockResponse.data.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        if (productExistsOnTheCart) {
            productExistsOnTheCart.amount += 1;
        } else {
            const responseProduct = await api.get(`products/${productId}`);
            updatedCart.push({
                ...responseProduct.data,
                amount: 1
            });
        }

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
        const updatedCart = [ ...cart ];
        const productExistsOnTheCartIndex = updatedCart.findIndex(product => product.id === productId);

        if (productExistsOnTheCartIndex >= 0) {
            updatedCart.splice(productExistsOnTheCartIndex, 1);
            setCart(updatedCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
            throw Error();
        }
    } catch {
        toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
        if (amount <= 0) return;

        const stockResponse = await api.get(`stock/${ productId }`);

        if (amount > stockResponse.data.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        const updatedCart = [ ...cart ];
        const productExistsOnTheCart = updatedCart.find(product => product.id === productId);

        if (productExistsOnTheCart) {
            productExistsOnTheCart.amount = amount;
            setCart(updatedCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
            throw Error();
        }
    } catch {
        toast.error('Erro na alteração da quantidade de produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  return useContext(CartContext);
}