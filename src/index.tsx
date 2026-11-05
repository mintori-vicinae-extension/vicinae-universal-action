import { useEffect, useState } from "react";
import { List, ActionPanel, Action, Clipboard, showToast, Toast, Icon } from "@vicinae/api";
import { classifyContent, getFileExtension } from "./classifier";
import { InputCategory, ActionContext, ActionDefinition } from "./types";
import { actions } from "./actions.config";
import { isActionMatching } from "./helpers/matcher";
import { defaultHelpers } from "./helpers/runtime";
import { checkClipboardImage, dumpClipboardImageToTemp } from "./helpers/clipboard";

export default function Command() {
  const [clip, setClip] = useState<string>("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [category, setCategory] = useState<InputCategory | null>(null);
  const [matchingActions, setMatchingActions] = useState<ActionDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadClipboard() {
      try {
        let activeClip = "";
        let activeCategory: InputCategory = { type: "plaintext" };
        let activeImg: string | null = null;

        const hasImage = await checkClipboardImage();
        if (hasImage) {
          const dumped = await dumpClipboardImageToTemp();
          if (dumped) {
            activeImg = dumped;
            activeCategory = { type: "image" };
            activeClip = "[Clipboard Image Data]";
            setImagePath(dumped);
            setCategory(activeCategory);
            setClip(activeClip);
          }
        }

        if (!activeImg) {
          const text = await Clipboard.readText();
          if (text) {
            activeClip = text;
            activeCategory = await classifyContent(text);
            setClip(text);
            setCategory(activeCategory);
          }
        }

        // Validate and filter matching actions asynchronously
        if (activeClip || activeImg) {
          const filterResults = await Promise.all(
            actions.map(async (act) => {
              const matches = await isActionMatching(act, {
                clip: activeClip,
                category: activeCategory,
              });
              return matches ? act : null;
            })
          );
          setMatchingActions(filterResults.filter(Boolean) as ActionDefinition[]);
        }
      } catch (err) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Clipboard Read Error",
          message: String(err),
        });
      } finally {
        setLoading(false);
      }
    }

    loadClipboard();
  }, []);

  const extension = category ? getFileExtension(category) : "txt";
  const context: ActionContext = {
    clip,
    category: category ?? { type: "plaintext" },
    extension,
  };

  const previewSnippet = clip ? clip.slice(0, 1000) : "";

  return (
    <List isLoading={loading} isShowingDetail={Boolean(clip || imagePath)}>
      {matchingActions.map((act, index) => {
        const detailMarkdown =
          category?.type === "image" && imagePath
            ? `![Preview](${imagePath})`
            : `\`\`\`${extension}\n${previewSnippet}\n\`\`\``;

        return (
          <List.Item
            key={act.id ?? `${act.name}-${index}`}
            title={act.name}
            icon={act.icon ?? (category?.type === "image" ? Icon.Image : Icon.Terminal)}
            detail={
              <List.Item.Detail
                markdown={detailMarkdown}
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title="Action" text={act.name} />
                    <List.Item.Detail.Metadata.Separator />
                    <List.Item.Detail.Metadata.Label
                      title="Type"
                      text={category?.type ?? "unknown"}
                    />
                    {category?.type === "code" && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Language"
                          text={category.lang}
                        />
                      </>
                    )}
                    {category?.type === "color" && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Hex Color"
                          text={category.hex}
                        />
                      </>
                    )}
                    {category?.type === "system" && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Kind"
                          text={category.kind}
                        />
                      </>
                    )}
                    {category?.type === "system" && category.kind === "path" && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Path"
                          text={clip.trim()}
                        />
                      </>
                    )}
                    {act.description && (
                      <>
                        <List.Item.Detail.Metadata.Separator />
                        <List.Item.Detail.Metadata.Label
                          title="Description"
                          text={act.description}
                        />
                      </>
                    )}
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              <ActionPanel>
                <Action
                  title="Run Action"
                  icon={Icon.Play}
                  onAction={async () => {
                    try {
                      await act.run(context, defaultHelpers);
                    } catch (err) {
                      await showToast({
                        style: Toast.Style.Failure,
                        title: `Error Running ${act.name}`,
                        message: String(err),
                      });
                    }
                  }}
                />
                {category?.type !== "image" && (
                  <Action.CopyToClipboard title="Copy Clipboard Content" content={clip} />
                )}
              </ActionPanel>
            }
          />
        );
      })}

      {!loading && (!clip && !imagePath || matchingActions.length === 0) && (
        <List.EmptyView
          icon={Icon.CopyClipboard}
          title={!clip && !imagePath ? "Empty Clipboard" : "No Matching Actions"}
          description={
            !clip && !imagePath
              ? "Copy a path, URL, image, code, or text snippet to get started."
              : `No actions match the criteria for the current clipboard data.`
          }
        />
      )}
    </List>
  );
}
