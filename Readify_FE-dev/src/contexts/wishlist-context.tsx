"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { WishlistApiRequest } from "@/api-request/wishlist";

interface WishlistContextType {
  wishlistCount: number;
  isInWishlist: (bookId: string) => boolean;
  addToWishlist: (bookId: string) => Promise<void>;
  removeFromWishlist: (bookId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
  wishlistBookIds: Set<string>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistBookIds, setWishlistBookIds] = useState<Set<string>>(
    new Set()
  );
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchWishlist = async () => {
    try {
      const response = await WishlistApiRequest.getWishlist();
      if (response.payload.success) {
        const bookIds = response.payload.data.map((item) => item.bookId._id);
        setWishlistBookIds(new Set(bookIds));
        setWishlistCount(bookIds.length);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      fetchWishlist();
    }
  }, [isInitialized]);

  const isInWishlist = (bookId: string) => {
    return wishlistBookIds.has(bookId);
  };

  const addToWishlist = async (bookId: string) => {
    try {
      const response = await WishlistApiRequest.addToWishlist({ bookId });
      if (response.payload.success) {
        setWishlistBookIds((prev) => new Set(prev).add(bookId));
        setWishlistCount((prev) => prev + 1);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const removeFromWishlist = async (bookId: string) => {
    try {
      await WishlistApiRequest.removeFromWishlist(bookId);
      setWishlistBookIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
      setWishlistCount((prev) => prev - 1);
    } catch (error: any) {
      throw error;
    }
  };

  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistCount,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist,
        wishlistBookIds,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
