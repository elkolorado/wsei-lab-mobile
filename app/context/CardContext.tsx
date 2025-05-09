import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '@/hooks/useAuth';
import { API_ENDPOINT } from '@/constatns/apiConfig';

interface Card {
    id: string;
    name: string;
    image: string;
    quantity: number;
    set: string;
}

interface CardContextProps {
    cardData: Card[];
    addCard: (newCard: Card) => Promise<void>;
    updateCardQuantity: (id: string, quantity: number) => Promise<void>;
    fetchCollection: () => Promise<void>;
}

const CardContext = createContext<CardContextProps | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cardData, setCardData] = useState<Card[]>([]);
    const { session } = useSession();

    // Fetch the collection from the backend
    const fetchCollection = async () => {
        try {
            const response = await fetch(`${API_ENDPOINT}/collection`, {
                headers: {
                    Authorization: `Bearer ${session}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch collection');
            }
            const data = await response.json();
            setCardData(data);
        } catch (error) {
            console.error('Error fetching collection:', error);
        }
    };

    // Add a card to the backend collection
    const addCard = async (newCard: Card) => {
        try {
            const response = await fetch(`${API_ENDPOINT}/collection/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session}`,
                },
                body: JSON.stringify(newCard),
            });
            if (!response.ok) {
                throw new Error('Failed to add card');
            }
            fetchCollection();
        } catch (error) {
            console.error('Error adding card:', error);
        }
    };

    // Update card quantity in the backend
    const updateCardQuantity = async (id: string, quantity: number) => {
        try {
            const response = await fetch(`${API_ENDPOINT}/collection/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session}`,
                },
                body: JSON.stringify({ id, quantity }),
            });
            if (!response.ok) {
                throw new Error('Failed to update card quantity');
            }
            // Update local state after successful update
            setCardData((prevData) =>
                prevData.map((card) => (card.id === id ? { ...card, quantity } : card))
            );
        } catch (error) {
            console.error('Error updating card quantity:', error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchCollection();
        }
    }, [session]);

    return (
        <CardContext.Provider value={{ cardData, addCard, updateCardQuantity, fetchCollection }}>
            {children}
        </CardContext.Provider>
    );
};

export const useCardContext = (): CardContextProps => {
    const context = useContext(CardContext);
    if (!context) {
        throw new Error('useCardContext must be used within a CardProvider');
    }
    return context;
};