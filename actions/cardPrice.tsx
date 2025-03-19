export async function fetchCardInfo(cardName: string): Promise<any> {
    const url = `http://192.168.1.3:8000/cardInfo?cardname=${encodeURIComponent(cardName)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
            name: String(data.name),
            number: String(data.number),
            availability: String(data.availability),
            price: String(data.price),
            expansion: String(data.expansion),
            link: String(data.link),
        };
    } catch (error) {
        console.error('Error fetching card info:', error);
        throw error;
    }
}