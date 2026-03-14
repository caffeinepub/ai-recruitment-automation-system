import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MessageTemplate, ScriptTemplate } from "../backend.d";
import { MessageType } from "../backend.d";
import {
  useCreateMessageTemplate,
  useCreateScriptTemplate,
  useDeleteMessageTemplate,
  useDeleteScriptTemplate,
  useMessageTemplates,
  useScriptTemplates,
  useUpdateMessageTemplate,
  useUpdateScriptTemplate,
} from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { newId, nowNs } from "../lib/data";

const MSG_TYPE_COLORS: Record<MessageType, string> = {
  [MessageType.interview]: "bg-blue-100 text-blue-700",
  [MessageType.followup]: "bg-purple-100 text-purple-700",
  [MessageType.general]: "bg-muted text-muted-foreground",
};

const VARIABLE_HINTS = [
  "{{name}}",
  "{{company}}",
  "{{date}}",
  "{{location}}",
  "{{role}}",
  "{{salary}}",
];

export default function TemplatesPage() {
  const { identity } = useInternetIdentity();
  const { data: scripts } = useScriptTemplates();
  const { data: messages } = useMessageTemplates();
  const createScript = useCreateScriptTemplate();
  const updateScript = useUpdateScriptTemplate();
  const deleteScript = useDeleteScriptTemplate();
  const createMsg = useCreateMessageTemplate();
  const updateMsg = useUpdateMessageTemplate();
  const deleteMsg = useDeleteMessageTemplate();

  const [scriptOpen, setScriptOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<ScriptTemplate | null>(
    null,
  );
  const [scriptForm, setScriptForm] = useState({ name: "", content: "" });

  const [msgOpen, setMsgOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<MessageTemplate | null>(null);
  const [msgForm, setMsgForm] = useState({
    name: "",
    content: "",
    type: MessageType.general as MessageType,
  });

  function openScriptCreate() {
    setEditingScript(null);
    setScriptForm({ name: "", content: "" });
    setScriptOpen(true);
  }
  function openScriptEdit(t: ScriptTemplate) {
    setEditingScript(t);
    setScriptForm({ name: t.name, content: t.content });
    setScriptOpen(true);
  }

  function openMsgCreate() {
    setEditingMsg(null);
    setMsgForm({ name: "", content: "", type: MessageType.general });
    setMsgOpen(true);
  }
  function openMsgEdit(t: MessageTemplate) {
    setEditingMsg(t);
    setMsgForm({ name: t.name, content: t.content, type: t.type });
    setMsgOpen(true);
  }

  async function saveScript() {
    if (!scriptForm.name) {
      toast.error("Name required");
      return;
    }
    const t: ScriptTemplate = {
      id: editingScript?.id ?? newId(),
      name: scriptForm.name,
      content: scriptForm.content,
      createdAt: editingScript?.createdAt ?? nowNs(),
      owner: identity!.getPrincipal(),
    };
    try {
      if (editingScript) {
        await updateScript.mutateAsync(t);
        toast.success("Updated");
      } else {
        await createScript.mutateAsync(t);
        toast.success("Created");
      }
      setScriptOpen(false);
    } catch {
      toast.error("Failed");
    }
  }

  async function saveMsg() {
    if (!msgForm.name) {
      toast.error("Name required");
      return;
    }
    const t: MessageTemplate = {
      id: editingMsg?.id ?? newId(),
      name: msgForm.name,
      content: msgForm.content,
      type: msgForm.type,
      createdAt: editingMsg?.createdAt ?? nowNs(),
      owner: identity!.getPrincipal(),
    };
    try {
      if (editingMsg) {
        await updateMsg.mutateAsync(t);
        toast.success("Updated");
      } else {
        await createMsg.mutateAsync(t);
        toast.success("Created");
      }
      setMsgOpen(false);
    } catch {
      toast.error("Failed");
    }
  }

  async function delScript(id: string) {
    if (!confirm("Delete template?")) return;
    try {
      await deleteScript.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  }

  async function delMsg(id: string) {
    if (!confirm("Delete template?")) return;
    try {
      await deleteMsg.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="p-6 space-y-4" data-ocid="templates.page">
      <div>
        <h1 className="text-2xl font-bold font-display">Templates</h1>
        <p className="text-muted-foreground text-sm">
          Manage calling scripts and WhatsApp templates
        </p>
      </div>

      <Tabs defaultValue="scripts">
        <TabsList data-ocid="templates.tabs">
          <TabsTrigger value="scripts" data-ocid="templates.scripts.tab">
            Calling Scripts
          </TabsTrigger>
          <TabsTrigger value="messages" data-ocid="templates.messages.tab">
            WhatsApp Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scripts" className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {scripts?.length ?? 0} scripts
            </p>
            <Button
              data-ocid="templates.create_script.button"
              size="sm"
              onClick={openScriptCreate}
            >
              <Plus className="w-3 h-3 mr-1" /> New Script
            </Button>
          </div>
          {scripts?.length === 0 ? (
            <div
              data-ocid="templates.scripts.empty_state"
              className="flex flex-col items-center py-16"
            >
              <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                No calling scripts yet
              </p>
            </div>
          ) : (
            scripts?.map((t, i) => (
              <Card
                key={t.id}
                data-ocid={`templates.script.item.${i + 1}`}
                className="border-0 shadow-xs"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t.name}</p>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`templates.script.edit.button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => openScriptEdit(t)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        data-ocid={`templates.script.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => delScript(t.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                    {t.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <span className="text-xs text-muted-foreground">Variables:</span>
              {VARIABLE_HINTS.map((v) => (
                <code
                  key={v}
                  className="text-xs bg-muted px-1.5 py-0.5 rounded"
                >
                  {v}
                </code>
              ))}
            </div>
            <Button
              data-ocid="templates.create_message.button"
              size="sm"
              onClick={openMsgCreate}
            >
              <Plus className="w-3 h-3 mr-1" /> New Template
            </Button>
          </div>
          {messages?.length === 0 ? (
            <div
              data-ocid="templates.messages.empty_state"
              className="flex flex-col items-center py-16"
            >
              <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                No WhatsApp templates yet
              </p>
            </div>
          ) : (
            messages?.map((t, i) => (
              <Card
                key={t.id}
                data-ocid={`templates.message.item.${i + 1}`}
                className="border-0 shadow-xs"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${MSG_TYPE_COLORS[t.type]}`}
                      >
                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`templates.message.edit.button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => openMsgEdit(t)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        data-ocid={`templates.message.delete_button.${i + 1}`}
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => delMsg(t.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                    {t.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Script Dialog */}
      <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
        <DialogContent data-ocid="templates.script.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingScript ? "Edit Script" : "New Calling Script"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Script Name</Label>
              <Input
                data-ocid="templates.script.name.input"
                value={scriptForm.name}
                onChange={(e) =>
                  setScriptForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Standard Intro Script"
              />
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea
                data-ocid="templates.script.content.textarea"
                value={scriptForm.content}
                onChange={(e) =>
                  setScriptForm((f) => ({ ...f, content: e.target.value }))
                }
                rows={8}
                placeholder="Write the calling script..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="templates.script.cancel.button"
              variant="outline"
              onClick={() => setScriptOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="templates.script.save.button"
              onClick={saveScript}
              disabled={createScript.isPending || updateScript.isPending}
            >
              {(createScript.isPending || updateScript.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent data-ocid="templates.message.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingMsg ? "Edit Template" : "New WhatsApp Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Template Name</Label>
                <Input
                  data-ocid="templates.message.name.input"
                  value={msgForm.name}
                  onChange={(e) =>
                    setMsgForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={msgForm.type}
                  onValueChange={(v) =>
                    setMsgForm((f) => ({ ...f, type: v as MessageType }))
                  }
                >
                  <SelectTrigger data-ocid="templates.message.type.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MessageType.interview}>
                      Interview
                    </SelectItem>
                    <SelectItem value={MessageType.followup}>
                      Follow-up
                    </SelectItem>
                    <SelectItem value={MessageType.general}>General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Message Content</Label>
              <Textarea
                data-ocid="templates.message.content.textarea"
                value={msgForm.content}
                onChange={(e) =>
                  setMsgForm((f) => ({ ...f, content: e.target.value }))
                }
                rows={6}
                placeholder="Namaste {{name}}, ..."
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Variables:{" "}
              {VARIABLE_HINTS.map((v) => (
                <code key={v} className="bg-muted px-1 rounded mx-0.5">
                  {v}
                </code>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="templates.message.cancel.button"
              variant="outline"
              onClick={() => setMsgOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="templates.message.save.button"
              onClick={saveMsg}
              disabled={createMsg.isPending || updateMsg.isPending}
            >
              {(createMsg.isPending || updateMsg.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
