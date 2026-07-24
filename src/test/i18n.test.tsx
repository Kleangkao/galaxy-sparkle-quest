import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

function Probe() {
  const { tr } = useI18n();
  return <p>{tr("Start playing", "เริ่มเล่น")}</p>;
}

describe("English and Thai language foundation", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("changes visible copy, saves the choice, and updates the page language", async () => {
    render(<I18nProvider><LanguageToggle /><Probe /></I18nProvider>);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("เริ่มเล่น")).toBeInTheDocument();
    expect(localStorage.getItem("galaxy-lang")).toBe("th");
    await waitFor(() => expect(document.documentElement.lang).toBe("th"));
  });

  it("restores Thai globally on the next visit", () => {
    localStorage.setItem("galaxy-lang", "th");
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByText("เริ่มเล่น")).toBeInTheDocument();
  });
});
