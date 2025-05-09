import React, { createContext, useContext, useState } from 'react';

interface Card {
    id: string;
    name: string;
    image: string;
    quantity: number;
    set: string;
}

interface CardContextProps {
    cardData: Card[];
    addCard: (newCard: Card) => void;
    updateCardQuantity: (id: string, quantity: number) => void;
}

const CardContext = createContext<CardContextProps | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cardData, setCardData] = useState<Card[]>([
        { id: '1', name: 'Card A', image: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/E-04.webp', quantity: 2, set: 'Set 1' },
        { id: '2', name: 'Card B', image: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/E-04.webp', quantity: 5, set: 'Set 1' },
        { id: '3', name: 'Card C', image: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/E-04.webp', quantity: 1, set: 'Set 2' },
        { id: '4', name: 'Card D', image: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/E-04.webp', quantity: 3, set: 'Set 2' },
    ]);

    const addCard = (newCard: Card) => {
        setCardData((prevData) => {
            const existingCardIndex = prevData.findIndex((card) => card.name === newCard.name);
            if (existingCardIndex !== -1) {
                const updatedData = [...prevData];
                updatedData[existingCardIndex].quantity += newCard.quantity;
                return updatedData;
            }
            return [...prevData, newCard];
        });
    };

    const updateCardQuantity = (id: string, quantity: number) => {
        setCardData((prevData) =>
            prevData.map((card) => (card.id === id ? { ...card, quantity } : card))
        );
    };

    return (
        <CardContext.Provider value={{ cardData, addCard, updateCardQuantity }}>
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