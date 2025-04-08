import React, { useState } from "react";
import {
    Box,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Typography,
    Button,
    TextField
} from "@mui/material";
import chapter1 from '../../data/chapter1';
import chapter2 from '../../data/chapter2';
import chapter3 from '../../data/chapter3';
// const promptDB = {
//     "Глава 1: Главный субъект (Main Subject)": {
//         "1.1 - Кто она / Тип персонажа (Character type)": [
//             { id: 1, ru: "аниме девушка", en: "anime girl", conflicts: [] },
//             { id: 2, ru: "андроид", en: "android", conflicts: [] },
//             { id: 3, ru: "эльфийка", en: "elf girl", conflicts: [] },
//             { id: 4, ru: "кошкодевочка", en: "catgirl", conflicts: [] },
//             { id: 5, ru: "воительница", en: "warrior woman", conflicts: [] }
//         ]
//     },
//     "Глава 2: Одежда и стиль (Clothing & Style)": {
//         "2.1 - Тип образа / ролевая тема (Role theme)": [
//             { id: 6, ru: "горничная", en: "maid", conflicts: [] },
//             { id: 7, ru: "медсестра", en: "nurse", conflicts: [] }
//         ]
//     },
//     "Глава 3: Анатомия и особенности (Anatomy & Body)": {
//         "3.1 - Рост (Height)": [
//             { id: 100, ru: "высокий рост", en: "tall height", conflicts: [101] },
//             { id: 101, ru: "низкий рост", en: "short height", conflicts: [100] }
//         ],
//         "3.2 - Размер груди (Breast size)": [
//             { id: 102, ru: "большая грудь", en: "large breasts", conflicts: [103] },
//             { id: 103, ru: "маленькая грудь", en: "small breasts", conflicts: [102] }
//         ]
//     }
// };
const promptDB = {
    ...chapter1,
    ...chapter2,
    ...chapter3,
};
function getPromptById(id) {
    for (const group of Object.values(promptDB)) {
        for (const prompts of Object.values(group)) {
            const found = prompts.find((p) => p.id === id);
            if (found) return found;
        }
    }
    return null;
}

function getAllPromptOrder() {
    const order = [];
    for (const group of Object.values(promptDB)) {
        for (const prompts of Object.values(group)) {
            order.push(...prompts.map((p) => p.id));
        }
    }
    return order;
}

export default function PromptSelector() {
    const [selectedPrompts, setSelectedPrompts] = useState({});

    const handleChange = (subcategory, selectedIds) => {
        const updated = {};
        const newPromptObjects = selectedIds.map(getPromptById).filter(Boolean);
        const newConflicts = newPromptObjects.flatMap((p) => p.conflicts);

        for (const [key, ids] of Object.entries(selectedPrompts)) {
            updated[key] = ids.filter((id) => !newConflicts.includes(id));
        }

        const lastSelectedId = selectedIds[selectedIds.length - 1];
        const lastPrompt = getPromptById(lastSelectedId);
        if (!lastPrompt) return;

        const cleaned = (updated[subcategory] || []).filter(
            (id) => !lastPrompt.conflicts.includes(id)
        );

        updated[subcategory] = Array.from(new Set([...cleaned, lastPrompt.id]));

        setSelectedPrompts(updated);
    };

    const handleDelete = (subcategory, id) => {
        setSelectedPrompts((prev) => ({
            ...prev,
            [subcategory]: prev[subcategory].filter((p) => p !== id)
        }));
    };

    const flatSelected = Object.values(selectedPrompts)
        .flat()
        .filter(Boolean);

    const orderedPromptIds = getAllPromptOrder().filter((id) => flatSelected.includes(id));
    const orderedPrompts = orderedPromptIds.map(getPromptById);
    const fullPrompt = orderedPrompts.map((p) => p.en).join(", ");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullPrompt);
            alert("Промпт скопирован!");
        } catch (err) {
            alert("Ошибка при копировании");
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 800, margin: "0 auto" }}>
            <Typography variant="h5" gutterBottom>
                Генератор промптов — С конфликтами
            </Typography>

            {Object.entries(promptDB).map(([chapter, subcategories]) => (
                <Box key={chapter} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>{chapter}</Typography>
                    {Object.entries(subcategories).map(([subcategory, prompts]) => (
                        <FormControl fullWidth sx={{ mb: 2 }} key={subcategory}>
                            <InputLabel>{subcategory}</InputLabel>
                            <Select
                                multiple
                                value={selectedPrompts[subcategory] || []}
                                onChange={(e) => handleChange(subcategory, e.target.value)}
                                input={<OutlinedInput label={subcategory} />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((id) => {
                                            const prompt = getPromptById(id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={`${prompt.ru} / ${prompt.en}`}
                                                    onMouseDown={(event) => event.stopPropagation()}
                                                    onDelete={() => handleDelete(subcategory, id)}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {prompts.map((prompt) => (
                                    <MenuItem key={prompt.id} value={prompt.id}>
                                        {prompt.ru} / {prompt.en}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ))}
                </Box>
            ))}

            {orderedPrompts.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">Сгенерированный промпт:</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={fullPrompt}
                        InputProps={{ readOnly: true }}
                        sx={{ mb: 2 }}
                    />
                    <Button variant="contained" onClick={handleCopy}>Скопировать</Button>
                </Box>
            )}
        </Box>
    );
}
