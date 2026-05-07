import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const FREELA_PREFIX = 'Freela: ';

interface TeamMemberSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

interface MemberOption {
  id: string;
  name: string;
}

// Cache per workspace to avoid refetching for every cell
const cache = new Map<string, MemberOption[]>();

export function TeamMemberSelect({ value, onChange, className, placeholder = 'Selecione quem executou' }: TeamMemberSelectProps) {
  const { workspace } = useAuth();
  const [members, setMembers] = useState<MemberOption[]>(() => (workspace ? cache.get(workspace.id) || [] : []));

  useEffect(() => {
    if (!workspace) return;
    if (cache.has(workspace.id)) {
      setMembers(cache.get(workspace.id)!);
      return;
    }
    (async () => {
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspace.id);
      if (!memberData || memberData.length === 0) {
        cache.set(workspace.id, []);
        setMembers([]);
        return;
      }
      const ids = memberData.map((m: any) => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ids);
      const list: MemberOption[] = (profilesData || [])
        .map((p: any) => ({ id: p.id, name: p.name || '' }))
        .filter((p) => p.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      cache.set(workspace.id, list);
      setMembers(list);
    })();
  }, [workspace]);

  const isFreela = value?.startsWith(FREELA_PREFIX);
  const freelaName = isFreela ? value.slice(FREELA_PREFIX.length) : '';

  // Determine the select value: a member name, "__freela__" for freela, or empty
  const selectValue = isFreela
    ? '__freela__'
    : value && members.some((m) => m.name === value)
      ? value
      : value
        ? '__custom__'
        : '';

  const handleSelectChange = (v: string) => {
    if (v === '__freela__') {
      onChange(FREELA_PREFIX);
    } else if (v === '__custom__') {
      // keep current value
    } else {
      onChange(v);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="h-8 w-full min-w-[140px] text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="z-[200]">
          {members.map((m) => (
            <SelectItem key={m.id} value={m.name}>
              {m.name}
            </SelectItem>
          ))}
          <SelectItem value="__freela__">Freela</SelectItem>
          {selectValue === '__custom__' && (
            <SelectItem value="__custom__">{value}</SelectItem>
          )}
        </SelectContent>
      </Select>
      {isFreela && (
        <Input
          value={freelaName}
          onChange={(e) => onChange(FREELA_PREFIX + e.target.value)}
          placeholder="Nome do freela"
          className="h-8 w-32 text-xs"
        />
      )}
    </div>
  );
}
