import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { iaPotentialMeta, type IAPotential } from '../data/catalogs'
import type { ProcessStepRecord } from '../state/deepDiveStore'
import { computeStepStats } from '../utils/stepStats'

type StepFlowNodeData = {
  order: number
  name: string
  iaPotential: IAPotential | ''
  dataCount: number
  ruleCount: number
  undocumentedCount: number
  systems: string[]
  onOpen: () => void
}

type StepFlowNodeType = Node<StepFlowNodeData, 'step'>

// Nodo custom del grafo — un paso del proceso, coloreado por su Potencial
// de automatización IA (mismo semáforo que las tarjetas de la vista
// general) con mini-stats, para no tener que abrir el paso solo para ver
// cuántos datos/reglas trae. Clic en el nodo navega a su página de captura.
const StepFlowNode = ({ data }: NodeProps<StepFlowNodeType>) => {
  const meta = data.iaPotential ? iaPotentialMeta(data.iaPotential) : null
  const color = meta?.color ?? '#9AA3AF'
  return (
    <Box
      onClick={data.onOpen}
      sx={{
        border: '2px solid',
        borderColor: color,
        borderRadius: 2,
        p: 1.25,
        width: 210,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        boxShadow: 1,
        '&:hover': { boxShadow: 3 },
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
        #{data.order}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }} noWrap title={data.name}>
        {data.name || 'Sin nombre'}
      </Typography>
      {meta && (
        <Typography variant="caption" sx={{ fontWeight: 700, color, display: 'block' }}>
          {meta.emoji} {meta.label.split(' (')[0]}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {data.dataCount} dato{data.dataCount === 1 ? '' : 's'} · {data.ruleCount} regla{data.ruleCount === 1 ? '' : 's'}
        {data.undocumentedCount > 0 && ` · ⚠️ ${data.undocumentedCount}`}
      </Typography>
      {data.systems.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          title={data.systems.join(', ')}
          sx={{ display: 'block' }}
        >
          🖥 {data.systems.join(', ')}
        </Typography>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </Box>
  )
}

const nodeTypes = { step: StepFlowNode }

// 🕸 Grafo de flujo del proceso — conecta los pasos en el orden en que se
// capturaron (Paso 1 → Paso 2 → ...). Si en el futuro cada dato declara
// explícitamente su cadena output→input entre pasos, las conexiones podrán
// enriquecerse con esa información; por ahora el orden de captura es la
// única cadena disponible en el modelo de datos.
export const ProcessFlowGraph = ({
  steps,
  onOpenStep,
}: {
  steps: ProcessStepRecord[]
  onOpenStep: (stepId: string) => void
}) => {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: StepFlowNodeType[] = steps.map((step, index) => {
      const stats = computeStepStats(step)
      return {
        id: step.id,
        type: 'step',
        position: { x: 0, y: index * 160 },
        data: {
          order: step.order,
          name: step.name,
          iaPotential: step.iaPotential,
          dataCount: stats.dataCount,
          ruleCount: stats.ruleCount,
          undocumentedCount: stats.undocumentedCount,
          systems: stats.systems,
          onOpen: () => onOpenStep(step.id),
        },
      }
    })

    const flowEdges: Edge[] = steps.slice(1).map((step, i) => ({
      id: `e-${steps[i].id}-${step.id}`,
      source: steps[i].id,
      target: step.id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#9AA3AF' },
    }))

    return { nodes: flowNodes, edges: flowEdges }
  }, [steps, onOpenStep])

  if (steps.length === 0) {
    return (
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary">Agrega pasos para ver cómo se conectan en el flujo.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: 460, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  )
}
