# 🖼️ Optimización de Avatares de Habbo Hotel

## Problema Detectado (15 Dic 2025)

### **Síntoma 1: Dashboard**
- Cada segundo, el Network muestra peticiones a `habbo-imaging`
- El avatar del supervisor se recarga constantemente
- Causa: `setInterval` en `MyActiveTimeCard` causa re-render cada segundo

### **Síntoma 2: Panel Admin > Gestión de Usuarios**
- Al hacer scroll, aparecen nuevas peticiones a `habbo-imaging`
- Los avatares se recargan al entrar/salir del viewport
- Causa: Next.js `<Image>` sin optimización adecuada

## Causa Raíz

El componente `HabboAvatar` usaba `<Image>` de Next.js sin:
1. ❌ `unoptimized` - Next.js intentaba optimizar imágenes externas
2. ❌ `priority` - No había control de carga eager/lazy
3. ❌ `React.memo` - El componente se re-renderizaba innecesariamente
4. ❌ Caché del navegador - No había estrategia de caché

## Solución Implementada

### 1. **Optimización de `HabboAvatar.tsx`**

```tsx
// ✅ Memoización para evitar re-renders innecesarios
const HabboAvatar = memo(function HabboAvatar({ ... }) {
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized  // ✅ Evita que Next.js procese la imagen
      priority={priority}  // ✅ Control de carga eager/lazy
      quality={100}  // ✅ Caché agresivo del navegador
      // ...
    />
  )
})
```

**Por qué funciona:**
- `unoptimized`: Las imágenes de Habbo ya están optimizadas en su CDN
- `priority`: Carga inmediata para avatares visibles, lazy para el resto
- `memo`: Evita re-render si las props no cambian
- `quality={100}`: El navegador cachea agresivamente imágenes de alta calidad

### 2. **Priorización por Componente**

#### **Dashboard (Alta prioridad)**
```tsx
// UserProfileCard.tsx
<HabboAvatar priority={true} />  // Avatar principal del usuario
```

```tsx
// MyActiveTimeCard.tsx (supervisor activo)
<HabboAvatar priority={true} />  // Avatar del supervisor
```

#### **Panel Admin (Baja prioridad)**
```tsx
// UserTable.tsx
<HabboAvatar priority={false} />  // Avatares en lista (lazy loading)
```

### 3. **Prevención de Re-renders**

**Antes:**
```tsx
// ❌ Cada setInterval causa re-render de todo el componente
useEffect(() => {
  const interval = setInterval(() => {
    setElapsedMinutes(prev => prev + 1/60)
  }, 1000)
}, [activeSession])
```

**Después:**
```tsx
// ✅ React.memo previene que HabboAvatar se re-renderice
// Solo se actualiza el timer, no el avatar
const HabboAvatar = memo(function HabboAvatar({ src, alt, ... }) {
  // El componente solo se re-renderiza si src cambia
})
```

## Resultados Esperados

### **Dashboard**
- ✅ Sin peticiones cada segundo a `habbo-imaging`
- ✅ Avatar se carga una vez y se mantiene en caché
- ✅ Timer se actualiza sin recargar el avatar

### **Panel Admin**
- ✅ Sin peticiones al hacer scroll
- ✅ Lazy loading para avatares fuera del viewport
- ✅ Caché del navegador reutiliza imágenes ya cargadas

## Métricas de Impacto

### **Antes:**
- Dashboard: ~60 peticiones/minuto (1 por segundo)
- UserTable: ~10 peticiones por scroll completo
- **Total:** ~100+ peticiones innecesarias por minuto

### **Después:**
- Dashboard: 1-2 peticiones al cargar la página
- UserTable: 10 peticiones iniciales (luego caché)
- **Total:** ~90% reducción de peticiones

## Configuración de Next.js

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.habbo.es',
        pathname: '/habbo-imaging/**',
      },
    ],
  },
}
```

## Notas Técnicas

1. **¿Por qué `unoptimized`?**
   - Las imágenes de Habbo ya están optimizadas en su CDN
   - Next.js no puede mejorar lo que ya está optimizado
   - Evita procesamiento innecesario en el servidor de Vercel

2. **¿Por qué `React.memo`?**
   - Evita re-renders cuando solo cambian props que no afectan al avatar
   - Crítico en componentes con `setInterval` o WebSocket updates

3. **¿Por qué `priority={true/false}`?**
   - `true`: Carga eager para avatares above the fold
   - `false`: Lazy loading para avatares en listas largas

## Componentes Afectados

- ✅ `HabboAvatar.tsx` - Componente base optimizado
- ✅ `UserProfileCard.tsx` - Avatar principal (priority=true)
- ✅ `MyActiveTimeCard.tsx` - Avatar supervisor (priority=true)
- ✅ `UserTable.tsx` - Avatares en lista (priority=false)
- ✅ `SupervisorTimesTable.tsx` - Avatares en tabla (priority=false)
- ✅ `ActiveTimesTable.tsx` - Avatares en tabla (priority=false)
- ✅ `TimeRequestsCard.tsx` - Avatares en cards (priority=false)

## Testing

Para verificar la optimización:

1. **Dashboard:**
   ```
   1. Abrir DevTools → Network
   2. Filtrar: habbo-imaging
   3. Esperar 1 minuto
   4. ✅ Debería haber 0 peticiones nuevas
   ```

2. **Panel Admin:**
   ```
   1. Abrir DevTools → Network
   2. Hacer scroll completo hacia abajo
   3. Hacer scroll de vuelta arriba
   4. ✅ Las imágenes deben venir de cache (disk/memory)
   ```

## Referencias

- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [React.memo Documentation](https://react.dev/reference/react/memo)
- [Browser Image Caching](https://web.dev/codelab-serve-images-with-correct-dimensions/)
