import { useState, useEffect } from "react";

export interface CustomProcedure {
	id: string;
	name: string;
	durationMinutes: number;
	phase: number;
	createdAt: number;
}

const STORAGE_KEY = "custom-procedures";

export function useCustomProcedures() {
	const [procedures, setProcedures] = useState<CustomProcedure[]>(() => {
		// Initialize with default procedures if storage is empty
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
		// Return default procedures
		return [
			{ id: "1", name: "Blood Draw", durationMinutes: 15, phase: 1, createdAt: Date.now() },
			{ id: "2", name: "Vital Signs", durationMinutes: 10, phase: 1, createdAt: Date.now() },
			{ id: "3", name: "ECG", durationMinutes: 30, phase: 1, createdAt: Date.now() },
			{ id: "4", name: "MRI Scan", durationMinutes: 60, phase: 1, createdAt: Date.now() },
			{ id: "5", name: "Physical Exam", durationMinutes: 45, phase: 1, createdAt: Date.now() },
			{ id: "6", name: "Questionnaire", durationMinutes: 20, phase: 1, createdAt: Date.now() },
		];
	});

	// Save to localStorage whenever procedures change
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(procedures));
	}, [procedures]);

	const addProcedure = (procedure: Omit<CustomProcedure, "id" | "createdAt">) => {
		const newProcedure: CustomProcedure = {
			...procedure,
			id: Date.now().toString(),
			createdAt: Date.now(),
		};
		setProcedures((prev) => [...prev, newProcedure]);
		return newProcedure.id;
	};

	const removeProcedure = (id: string) => {
		setProcedures((prev) => prev.filter((p) => p.id !== id));
	};

	const updateProcedure = (id: string, updates: Partial<CustomProcedure>) => {
		setProcedures((prev) =>
			prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
		);
	};

	return {
		procedures,
		addProcedure,
		removeProcedure,
		updateProcedure,
	};
}

