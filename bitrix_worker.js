const updateFileFieldWebhookUrl = "https://legal-shield.bitrix24.ru/rest/86466/ajh6x02od0rbf2qy/crm.timeline.comment.add.json";

async function updateDeal(dealId, fileContent) {
    const currentTimestamp = Date.now();
    const fileName = `document_${currentTimestamp}.pdf`;

    try {
        const response = await axios.post(updateFileFieldWebhookUrl, {
            fields: {
                ENTITY_ID: dealId,
                ENTITY_TYPE: "deal",
                COMMENT: "PDF презентация",
                FILES: [[fileName, fileContent]]
            }
        });

        console.log("Сделка успешно обновлена", response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка при обновлении сделки:', error.response?.data || error.message);
        throw error;
    }
};