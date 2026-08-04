import { useMemo } from 'react'
import { Box, Chip, Typography } from '@mui/material'
import { Background, BackgroundVariant, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { ProcessStepRecord } from '../state/deepDiveStore'

// Paleta fija para distinguir de qué documento/fuente viene cada relación.
// No se agrega ninguna librería de layout de grafos nueva (dagre/elk) —
// basta una cuadrícula simple porque el volumen de nodos por proceso es
// manejable (decenas, no miles); los nodos quedan arrastrables por si el
// usuario quiere acomodarlos mejor.
const SOURCE_COLORS = ['#2563EB', '#DB2777', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DC2626', '#65A30D']

interface RelationshipEdgeInfo {
  fromNode: string
  relationType: string
  toNode: string
  /** "Nombre del paso · archivo.pdf" — para colorear/etiquetar de qué documento vino esta relación. */
  sourceLabel: string
}

// 🕸 Grafo CONSOLIDADO de relaciones de datos — a diferencia de
// ProcessFlowGraph (que conecta PASOS entre sí en orden de captura), este
// agrega el "grafo de relaciones" que el DocumentExtractionAgent propuso
// para CADA PDF subido en CUALQUIER fuente de CUALQUIER paso del proceso.
// Hoy cada fuente (ver StepCapturePage.tsx) solo muestra su propio
// mini-grafo aislado — esta vista da la foto de conjunto. Puramente de
// lectura: no persiste nada nuevo, solo re-lee
// `step.fuentesNoEstructuradas[].extraction.relationships` ya guardado.
export const DataRelationshipsGraph = ({ steps }: { steps: ProcessStepRecord[] }) => {
  const { nodes, edges, sources, relationshipCount } = useMemo(() => {
    const relationships: RelationshipEdgeInfo[] = []
    for (const step of steps) {
      for (const fuente of step.fuentesNoEstructuradas ?? []) {
        if (!fuente.extraction) continue
        const sourceLabel = `${step.name || 'Paso sin nombre'} · ${fuente.extraction.fileName}`
        for (const rel of fuente.extraction.relationships) {
          relationships.push({ ...rel, sourceLabel })
        }
      }
    }

    const uniqueSources = Array.from(new Set(relationships.map((r) => r.sourceLabel)))
    const colorForSource = (label: string) => SOURCE_COLORS[uniqueSources.indexOf(label) % SOURCE_COLORS.length]

    // Deduplica nodos por nombre normalizado (case-insensitive) — así una
    // entidad mencionada en dos documentos distintos (ej. "MAIN COLL
    // AGENCIES") queda como UN solo nodo con aristas de ambas fuentes.
    const nodeIdByName = new Map<string, string>()
    const nodeLabelById = new Map<string, string>()
    const registerNode = (name: string) => {
      const key = name.trim().toLowerCase()
      if (!nodeIdByName.has(key)) {
        const id = `n-${nodeIdByName.size}`
        nodeIdByName.set(key, id)
        nodeLabelById.set(id, name.trim())
      }
      return nodeIdByName.get(key)!
    }
    for (const rel of relationships) {
      registerNode(rel.fromNode)
      registerNode(rel.toNode)
    }

    const nodeIds = Array.from(nodeLabelById.keys())
    const columns = Math.max(1, Math.ceil(Math.sqrt(nodeIds.length)))
    const flowNodes: Node[] = nodeIds.map((id, i) => ({
      id,
      position: { x: (i % columns) * 220, y: Math.floor(i / columns) * 110 },
      data: { label: nodeLabelById.get(id) },
      style: {
        border: '1px solid #9AA3AF',
        borderRadius: 8,
        padding: 8,
        fontSize: 12,
        width: 190,
        background: '#ffffff',
        color: '#111827',
      },
    }))

    const flowEdges: Edge[] = relationships.map((rel, i) => {
      const color = colorForSource(rel.sourceLabel)
      return {
        id: `e-${i}`,
        source: nodeIdByName.get(rel.fromNode.trim().toLowerCase())!,
        target: nodeIdByName.get(rel.toNode.trim().toLowerCase())!,
        label: rel.relationType,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: { stroke: color },
        labelStyle: { fill: color, fontWeight: 600, fontSize: 11 },
      }
    })

    return { nodes: flowNodes, edges: flowEdges, sources: uniqueSources, relationshipCount: relationships.length }
  }, [steps])

  if (relationshipCount === 0) {
    return (
      <Box
        sx={{
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Typography color="text.secondary" align="center" sx={{ px: 3 }}>
          Sube documentos en las fuentes de los pasos para ver aquí el grafo de relaciones consolidado del proceso.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
        {sources.map((label, i) => (
          <Chip
            key={label}
            size="small"
            label={label}
            sx={{
              bgcolor: `${SOURCE_COLORS[i % SOURCE_COLORS.length]}1F`,
              color: SOURCE_COLORS[i % SOURCE_COLORS.length],
              fontWeight: 600,
            }}
          />
        ))}
      </Box>
      <Box sx={{ height: 460, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
    </Box>
  )
}
