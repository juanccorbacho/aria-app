import { Alert, View, TouchableOpacity, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WorkspaceSettingsScreen(): React.JSX.Element {
  const { user } = useAuth();
  
  // Safe extraction of workspace ID
  const workspaceId: string | undefined = user?.user_metadata?.workspace_id;

  const handleSyncPartner = () => {
    Alert.alert(
      "Sincronizar com Parceiro",
      "Na Fase 4, você poderá enviar um convite para o seu parceiro(a). Ele(a) entrará no mesmo Workspace que você, e ambos compartilharão as finanças do casal em tempo real."
    );
  };

  return (
    <ThemedView className="flex-1 bg-[#08090a] px-6 pt-12 pb-12">
      <View className="flex-1 w-full max-w-[720px] self-center flex flex-col gap-8">
        
        {/* Header */}
        <View className="flex flex-col gap-1">
          <ThemedText type="title" className="text-3xl font-[590] text-[#f7f8f8] tracking-tight">Workspace do Casal</ThemedText>
          <ThemedText className="text-[#d0d6e0] font-[400]">Gerencie os membros e o acesso compartilhado do seu ambiente financeiro.</ThemedText>
        </View>

        {/* Workspace Info Panel */}
        <View className="bg-[#191a1b] rounded-2xl p-5 border-[0.5px] border-white/10 flex flex-col gap-4">
          <View>
            <ThemedText className="text-[#d0d6e0] mb-1 font-[510] text-sm">ID do Workspace Atual</ThemedText>
            <View className="bg-white/5 border-[0.5px] border-white/10 p-3 rounded-lg flex flex-row items-center justify-between">
              <ThemedText type="monoLabel" className="text-[#f7f8f8]">{workspaceId ?? "Carregando..."}</ThemedText>
            </View>
          </View>
          
          <ThemedText className="text-xs text-[#d0d6e0]/60">Este é o identificador único do seu ambiente. No futuro, ele será usado nos convites.</ThemedText>
        </View>

        {/* Members List (Simulated) */}
        <View className="flex flex-col gap-3">
          <ThemedText type="subtitle" className="text-xl font-[590] text-[#f7f8f8]">Membros</ThemedText>
          
          <View className="bg-[#191a1b] rounded-2xl border-[0.5px] border-white/10 flex flex-col">
            {/* Current User */}
            <View className="px-5 py-4 border-b-[0.5px] border-white/10 flex flex-row items-center justify-between">
              <View className="flex flex-col">
                <ThemedText className="font-[510] text-[#f7f8f8]">{user?.email}</ThemedText>
                <ThemedText className="text-xs text-[#d0d6e0]">Você (Proprietário)</ThemedText>
              </View>
              <View className="bg-[#10b981]/10 border-[0.5px] border-[#10b981]/30 px-3 py-1 rounded-full">
                <ThemedText type="monoLabel" className="text-[#10b981] text-[10px]">ATIVO</ThemedText>
              </View>
            </View>
            
            {/* Simulated Partner Slot */}
            <View className="px-5 py-4 flex flex-row items-center justify-between opacity-50">
              <View className="flex flex-col">
                <ThemedText className="font-[510] text-[#d0d6e0]">Parceiro(a)</ThemedText>
                <ThemedText className="text-xs text-[#d0d6e0]/60">Aguardando convite</ThemedText>
              </View>
              <View className="bg-white/5 border-[0.5px] border-white/10 px-3 py-1 rounded-full">
                <ThemedText type="monoLabel" className="text-[#d0d6e0] text-[10px]">PENDENTE</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View className="mt-4">
          <TouchableOpacity 
            onPress={handleSyncPartner}
            className="bg-[#5e6ad2] border-[0.5px] border-[#5e6ad2]/80 items-center py-4 rounded-xl flex flex-row justify-center gap-2"
          >
            <Text className="text-[#f7f8f8] font-[590] text-base">Sincronizar com Parceiro</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ThemedView>
  );
}
