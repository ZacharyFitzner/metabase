import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";

import { InteractiveQuestion } from "embedding-sdk/components/public/InteractiveQuestion";
import { Box, Group, Overlay, Paper, Tabs } from "metabase/ui";

import type { InteractiveQuestionProps } from "../../public/InteractiveQuestion";
import type { NotebookProps } from "../InteractiveQuestion/components";
import { useInteractiveQuestionContext } from "../InteractiveQuestion/context";

export type QuestionEditorProps = Pick<NotebookProps, "models">;

const QuestionEditorInner = ({ models }: QuestionEditorProps) => {
  const { queryResults, runQuestion, isSaveEnabled } =
    useInteractiveQuestionContext();

  const [activeTab, setActiveTab] = useState<
    "notebook" | "visualization" | (string & unknown) | null
  >("notebook");
  const [isSaveFormOpen, { open: openSaveForm, close: closeSaveForm }] =
    useDisclosure(false);

  const onOpenVisualizationTab = async () => {
    setActiveTab("visualization");
    await runQuestion();
  };

  return (
    <Box w="100%" h="100%">
      <Tabs
        value={activeTab}
        onTabChange={setActiveTab}
        defaultValue="notebook"
      >
        <Group position="apart">
          <Group>
            <Tabs.Tab value="notebook">Notebook</Tabs.Tab>
            {queryResults ? (
              <Tabs.Tab value="visualization" onClick={onOpenVisualizationTab}>
                Visualization
              </Tabs.Tab>
            ) : null}
          </Group>
          {!isSaveFormOpen && (
            <Group>
              <InteractiveQuestion.ResetButton
                onClick={() => {
                  setActiveTab("notebook");
                  closeSaveForm();
                }}
              />
              {isSaveEnabled && (
                <InteractiveQuestion.SaveButton onClick={openSaveForm} />
              )}
            </Group>
          )}
        </Group>

        <Tabs.Panel value="notebook">
          <InteractiveQuestion.Notebook
            onApply={() => setActiveTab("visualization")}
            models={models}
          />
        </Tabs.Panel>

        <Tabs.Panel value="visualization">
          <InteractiveQuestion.QuestionVisualization />
        </Tabs.Panel>
      </Tabs>

      {isSaveEnabled && isSaveFormOpen && (
        <Overlay center>
          <Paper>
            <InteractiveQuestion.SaveQuestionForm onClose={closeSaveForm} />
          </Paper>
        </Overlay>
      )}
    </Box>
  );
};

export const QuestionEditor = ({
  questionId,
  isSaveEnabled = true,
  onBeforeSave,
  onSave,
  plugins,
  models,
}: InteractiveQuestionProps & QuestionEditorProps) => (
  <InteractiveQuestion
    questionId={questionId}
    plugins={plugins}
    onSave={onSave}
    onBeforeSave={onBeforeSave}
    isSaveEnabled={isSaveEnabled}
  >
    <QuestionEditorInner models={models} />
  </InteractiveQuestion>
);
