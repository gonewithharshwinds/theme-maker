"use client";

import React, { useState, useEffect, useRef } from "react";
import pantoneDataRaw from "../../pantone-colors-master/pantone-numbers.json";

interface PantoneColorInfo {
  name: string;
  hex: string;
}

const pantoneData = pantoneDataRaw as Record<string, PantoneColorInfo>;

// Auto-resolve index of Pantone names and numbers
const pantoneList: { code: string; name: string; hex: string }[] = Object.entries(pantoneData).map(
  ([code, info]) => ({
    code,
    name: info.name,
    hex: info.hex.startsWith("#") ? info.hex : `#${info.hex}`,
  })
);

interface AutocompleteColorInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function AutocompleteColorInput({
  value,
  onChange,
  placeholder = "Type color (Hex or Pantone name)...",
  className = "",
}: AutocompleteColorInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestion, setSuggestion] = useState("");
  const [suggestionHex, setSuggestionHex] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Match input against Pantone dictionary
  useEffect(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query || query.startsWith("#")) {
      setSuggestion("");
      setSuggestionHex("");
      return;
    }

    // Try to find a pantone matching name or code
    const match = pantoneList.find(
      (p) =>
        p.name.toLowerCase().startsWith(query) ||
        p.code.toLowerCase().startsWith(query) ||
        `pantone-${p.name.toLowerCase()}`.startsWith(query)
    );

    if (match) {
      // Choose what portion to overlay as suggestion
      let matchText = match.name;
      if (match.code.toLowerCase().startsWith(query)) {
        matchText = match.code;
      } else if (`pantone-${match.name.toLowerCase()}`.startsWith(query)) {
        matchText = `pantone-${match.name}`;
      }

      if (matchText.toLowerCase() !== query) {
        // Only show ghost text for the remainder of the suggestion
        const typedLength = query.length;
        setSuggestion(inputValue + matchText.slice(typedLength));
        setSuggestionHex(match.hex);
      } else {
        setSuggestion("");
        setSuggestionHex(match.hex);
      }
    } else {
      setSuggestion("");
      setSuggestionHex("");
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Tab" || e.key === "ArrowRight" || e.key === "Enter") && suggestion) {
      e.preventDefault();
      acceptSuggestion();
    }
  };

  const acceptSuggestion = () => {
    if (suggestion) {
      setInputValue(suggestion);
      onChange(suggestion);
      setSuggestion("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  };

  const handleBlur = () => {
    onChange(inputValue);
  };

  // Check if current value matches a Pantone to render matched badge
  const matchedPantone = pantoneList.find(
    (p) =>
      p.name.toLowerCase() === inputValue.trim().toLowerCase() ||
      p.code.toLowerCase() === inputValue.trim().toLowerCase() ||
      `pantone-${p.name.toLowerCase()}` === inputValue.trim().toLowerCase()
  );

  const activeColorHex = matchedPantone
    ? matchedPantone.hex
    : inputValue.startsWith("#")
    ? inputValue
    : "";

  return (
    <div className="relative w-full flex flex-col gap-1.5">
      <div className="relative w-full h-9 rounded-md border border-input bg-background flex items-center px-3 shadow-xs">
        {/* Color preview swatch on the left inside input */}
        {activeColorHex && (
          <span
            className="w-4 h-4 rounded-full border border-black/10 mr-2 shrink-0 transition-colors"
            style={{ backgroundColor: activeColorHex }}
          />
        )}

        <div className="relative flex-1 h-full flex items-center">
          {/* Ghost Suggestion Span */}
          {suggestion && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-mono text-sm pointer-events-none select-none whitespace-pre text-left">
              {suggestion}
            </span>
          )}

          {/* Actual Editable Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full h-full bg-transparent outline-none border-none p-0 text-sm font-mono focus:ring-0 focus:ring-offset-0 ${className}`}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Pantone badge indicator */}
      {matchedPantone && (
        <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-semibold select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
          Matched Pantone: {matchedPantone.code} ({matchedPantone.name})
        </div>
      )}
    </div>
  );
}
