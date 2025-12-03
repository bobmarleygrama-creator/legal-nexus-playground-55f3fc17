import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Video, CheckCircle, Paperclip, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Storage } from "@/utils/storage";
import { Caso, Mensagem } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const { casoId } = useParams<{ casoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [caso, setCaso] = useState<Caso | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!casoId) {
      navigate(-1);
      return;
    }
    
    const loadedCaso = Storage.getCasoById(casoId);
    if (!loadedCaso) {
      navigate(-1);
      return;
    }
    
    setCaso(loadedCaso);
    loadMensagens();
  }, [casoId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const loadMensagens = () => {
    if (!casoId) return;
    setMensagens(Storage.getMensagens(casoId));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = () => {
    if (!newMessage.trim() || !user || !casoId) return;

    const msg: Mensagem = {
      id: Storage.generateId(),
      caso_id: casoId,
      remetente_id: user.id,
      remetente_nome: user.nome,
      texto: newMessage.trim(),
      criado_em: new Date().toISOString(),
      tipo: "texto",
    };

    Storage.saveMensagem(msg);
    setMensagens([...mensagens, msg]);
    setNewMessage("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !casoId) return;

    const isImage = file.type.startsWith("image/");
    const blobUrl = URL.createObjectURL(file);
    
    const msg: Mensagem = {
      id: Storage.generateId(),
      caso_id: casoId,
      remetente_id: user.id,
      remetente_nome: user.nome,
      texto: isImage ? `🖼️ Imagem: ${blobUrl}` : `📎 Arquivo: ${file.name}|${blobUrl}`,
      criado_em: new Date().toISOString(),
      tipo: isImage ? "imagem" : "arquivo",
    };

    Storage.saveMensagem(msg);
    setMensagens([...mensagens, msg]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVideoCall = () => {
    const roomId = `socialjuris-${casoId}`;
    const jitsiUrl = `https://meet.jit.si/${roomId}`;
    
    const msg: Mensagem = {
      id: Storage.generateId(),
      caso_id: casoId!,
      remetente_id: user!.id,
      remetente_nome: user!.nome,
      texto: `🎥 Sala de vídeo criada: ${jitsiUrl}`,
      criado_em: new Date().toISOString(),
      tipo: "video",
    };

    Storage.saveMensagem(msg);
    setMensagens([...mensagens, msg]);
    
    window.open(jitsiUrl, "_blank");
  };

  const handleConcluir = () => {
    if (rating === 0) return;
    
    Storage.updateCaso(casoId!, {
      status: "concluido",
      avaliacao: rating,
    });
    
    setShowRatingModal(false);
    toast({
      title: "Caso concluído!",
      description: `Avaliação: ${rating} estrelas`,
    });
    
    setTimeout(() => {
      navigate("/dashboard/cliente");
    }, 1500);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessageContent = (msg: Mensagem) => {
    if (msg.tipo === "imagem" && msg.texto.startsWith("🖼️ Imagem:")) {
      const url = msg.texto.replace("🖼️ Imagem: ", "");
      return (
        <img 
          src={url} 
          alt="Imagem enviada" 
          className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => window.open(url, "_blank")}
        />
      );
    }
    
    if (msg.tipo === "arquivo" && msg.texto.startsWith("📎 Arquivo:")) {
      const parts = msg.texto.replace("📎 Arquivo: ", "").split("|");
      const fileName = parts[0];
      const url = parts[1];
      return (
        <a 
          href={url} 
          download={fileName}
          className="flex items-center gap-2 text-sm underline hover:no-underline"
        >
          📎 {fileName}
        </a>
      );
    }
    
    if (msg.tipo === "video" || msg.texto.includes("meet.jit.si")) {
      const urlMatch = msg.texto.match(/https:\/\/meet\.jit\.si\/[^\s]+/);
      if (urlMatch) {
        return (
          <div>
            <p className="mb-2">🎥 Sala de vídeo criada</p>
            <a 
              href={urlMatch[0]} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-primary-foreground/20 hover:bg-primary-foreground/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Entrar na Sala Agora
            </a>
          </div>
        );
      }
    }
    
    return <p className="whitespace-pre-wrap">{msg.texto}</p>;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (!caso) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">Chat do Caso</h1>
            <p className="text-xs text-muted-foreground">#{casoId?.substring(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-purple-600 border-purple-600" onClick={handleVideoCall}>
            <Video className="w-4 h-4 mr-1" />
            Vídeo
          </Button>
          
          {user?.tipo === "cliente" && caso.status !== "concluido" && (
            <Button variant="outline" size="sm" className="text-green-600 border-green-600" onClick={() => setShowRatingModal(true)}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Concluir
            </Button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
        <AnimatePresence>
          {mensagens.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex mb-4 ${msg.remetente_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2 max-w-[80%] ${msg.remetente_id === user?.id ? "flex-row-reverse" : ""}`}>
                {msg.remetente_id !== user?.id && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                    {getInitials(msg.remetente_nome)}
                  </div>
                )}
                
                <div>
                  {msg.remetente_id !== user?.id && (
                    <p className="text-[10px] text-muted-foreground uppercase mb-1 ml-1">
                      {msg.remetente_nome}
                    </p>
                  )}
                  <div className={`chat-bubble ${msg.remetente_id === user?.id ? "chat-bubble-own" : "chat-bubble-other"}`}>
                    {renderMessageContent(msg)}
                    <p className={`text-[10px] mt-1 ${msg.remetente_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>
                      {formatTime(msg.criado_em)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>
          
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Encerrar Caso</DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground mb-4">
            Como foi o atendimento do advogado?
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowRatingModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConcluir} disabled={rating === 0}>
              Avaliar e Encerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
