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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import chapter1 from '../../data/chapter1';
import chapter2 from '../../data/chapter2';
import chapter3 from '../../data/chapter3';

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
    const [open, setOpen] = useState(false);
    const [addToSubcategory, setAddToSubcategory] = useState("");

    const handleChange = (subcategory, selectedIds) => {
        const updated = { ...selectedPrompts };
        const currentSelected = updated[subcategory] || [];

        // Найдём, какой ID был изменён
        const added = selectedIds.find(id => !currentSelected.includes(id));
        const removed = currentSelected.find(id => !selectedIds.includes(id));

        if (removed) {
            updated[subcategory] = currentSelected.filter(id => id !== removed);
            setSelectedPrompts(updated);
            return;
        }

        if (!added) return;

        const newPrompt = getPromptById(added);
        if (!newPrompt) return;

        // Удаляем конфликтующие теги
        for (const key in updated) {
            updated[key] = (updated[key] || []).filter(id => !newPrompt.conflicts.includes(id));
        }

        const cleaned = (updated[subcategory] || []).filter(id => !newPrompt.conflicts.includes(id));
        updated[subcategory] = Array.from(new Set([...cleaned, newPrompt.id]));

        setSelectedPrompts(updated);
    };

    const handleDelete = (subcategory, id) => {
        setSelectedPrompts((prev) => ({
            ...prev,
            [subcategory]: prev[subcategory].filter((p) => p !== id)
        }));
    };

    const handleManualAdd = (subcategory, id) => {
        const prompt = getPromptById(id);
        if (!prompt) return;

        setSelectedPrompts((prev) => {
            const newState = { ...prev };

            for (const key in newState) {
                newState[key] = newState[key].filter((pid) => !prompt.conflicts.includes(pid));
            }

            newState[subcategory] = Array.from(
                new Set([...(newState[subcategory] || []).filter((pid) => !prompt.conflicts.includes(pid)), id])
            );

            return newState;
        });
        setOpen(false);
    };

    const flatSelected = Object.values(selectedPrompts).flat().filter(Boolean);
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
            <Typography variant="h5" gutterBottom sx={{textAlign: "center", mb: 5}}>
                Генератор промптов
            </Typography>

            {Object.entries(promptDB).map(([chapter, subcategories]) => (
                <Box key={chapter} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>{chapter}</Typography>
                    {Object.entries(subcategories).map(([subcategory, prompts]) => (
                        <FormControl fullWidth sx={{ mb: 2 }} key={subcategory}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <InputLabel>{subcategory}</InputLabel>
                            </Box>
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
                                                    label={`${prompt.ru}`}
                                                    onMouseDown={(event) => event.stopPropagation()}
                                                    onDelete={() => handleDelete(subcategory, id)}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {prompts.map((prompt) => {
                                    const conflictsWith = flatSelected.filter(selectedId =>
                                        getPromptById(selectedId)?.conflicts?.includes(prompt.id)
                                    );
                                    const isConflicting = conflictsWith.length > 0;

                                    return (
                                        <MenuItem
                                            key={prompt.id}
                                            value={prompt.id}
                                            sx={{
                                                opacity: isConflicting ? 0.8 : 1,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >

                                                <Typography>
                                                    {prompt.ru}
                                                </Typography>
                                                {isConflicting && (
                                                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {conflictsWith.map(id => {
                                                            const p = getPromptById(id);
                                                            return (
                                                                <Chip
                                                                    key={id}
                                                                    label={p?.ru || id}
                                                                    size="small"
                                                                    color="error"
                                                                    variant="outlined"
                                                                />
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                        </MenuItem>
                                    );
                                })}

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

                    <Typography variant="h6" sx={{ mt: 2 }}>Выбранные теги:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {orderedPrompts.map((prompt) => {
                            const subcategory = Object.keys(selectedPrompts).find((key) =>
                                selectedPrompts[key].includes(prompt.id)
                            );
                            return (
                                <React.Fragment key={prompt.id}>
                                    <Chip
                                        label={`${prompt.ru} / ${prompt.en}`}
                                        onDelete={() => handleDelete(subcategory, prompt.id)}
                                    />
                                    <IconButton
                                        aria-label="добавить тег"
                                        size="small"
                                        onClick={() => {
                                            setAddToSubcategory(subcategory);
                                            setOpen(true);
                                        }}
                                        sx={{ background: '#44944A' }}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </React.Fragment>
                            );
                        })}
                    </Box>

                    <Button variant="contained" sx={{ mt: 2 }} onClick={handleCopy}>
                        Скопировать
                    </Button>
                </Box>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth
                    maxWidth="lg">
                <DialogTitle>Добавить тег вручную</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {addToSubcategory && promptDB && Object.entries(promptDB).flatMap(([_, subcats]) => (
                        Object.entries(subcats).map(([key, prompts]) => (
                            key === addToSubcategory && prompts.map((prompt) => {
                                const conflictsWith = flatSelected.filter(id => getPromptById(id)?.conflicts?.includes(prompt.id));
                                const isConflicting = conflictsWith.length > 0;
                                const tooltipTitle = isConflicting
                                    ? `Заменит: ${conflictsWith.map(id => getPromptById(id)?.ru).join(", ")}`
                                    : "Можно выбрать";
                                return (
                                    <Tooltip key={prompt.id} title={tooltipTitle} arrow>
                                        <Chip
                                            label={`${prompt.ru} / ${prompt.en}`}
                                            onClick={() => handleManualAdd(addToSubcategory, prompt.id)}
                                            sx={{
                                                cursor: 'pointer',
                                                opacity: isConflicting ? 0.6 : 1,
                                                border: isConflicting ? '1px solid red' : undefined,
                                                m: 0.5
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })
                        ))
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
