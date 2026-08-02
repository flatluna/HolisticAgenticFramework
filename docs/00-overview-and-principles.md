# 00 · Propósito, Misión y Principios de Diseño

## 1. Qué es AETP

**AETP (Autonomous Enterprise Transformation Platform)** es una plataforma de
**consultoría y transformación**, no una plataforma de ejecución.

| AETP SÍ hace | AETP NO hace |
|---|---|
| Estructura y guía el diagnóstico, diseño y roadmap de transformación | Construir agentes (no es un agent builder) |
| Traza estrategia → objetivos → capacidades → procesos → oportunidades de IA/agentes → iniciativas → roadmap → resultado | Desplegar agentes en producción |
| Da soporte a consultores y clientes con métodos, plantillas y evidencia | Ejecutar procesos de negocio |
| Mide madurez, prioriza inversión, gestiona el caso de negocio | Reemplazar la gobernanza humana de decisiones |

## 2. Misión Central

Ayudar a consultores y clientes a entender de forma integral:

Estrategia · Objetivos · Modelo de Negocio · Organización · Capacidades · Procesos ·
Datos · Aplicaciones · Gobierno · Habilidades · Gestión del Cambio · Oportunidades de
IA · Oportunidades Agénticas

...y transformarlos en una **Empresa Autónoma**.

## 3. Principios de Diseño (no negociables)

Estos principios son criterios de decisión para cualquier feature, pantalla o dato que
se incorpore a la plataforma. Si una decisión de producto viola alguno, se rechaza o se
replantea.

1. **La tecnología sigue a la estrategia de negocio** — nunca al revés.
2. **Valor de negocio antes que IA** — no se justifica una capacidad de IA sin un
   objetivo/KPI de negocio al que sirva.
3. **Capacidades antes que soluciones** — se define "qué debe poder hacer la empresa"
   antes de elegir cualquier tecnología o agente.
4. **Procesos antes que agentes** — un agente automatiza un proceso ya entendido y
   rediseñado, nunca un proceso ambiguo.
5. **Gobierno antes que autonomía** — ningún dominio escala autonomía sin controles de
   gobierno de datos, IA y riesgo ya definidos.
6. **Colaboración Humano-IA antes que automatización total** — el diseño por defecto es
   *human-in/on-the-loop*; la autonomía plena es un destino a ganar, no un punto de
   partida.

## 4. Trazabilidad end-to-end (resumen)

```
Estrategia → Objetivo → Capacidad → Proceso → Oportunidad → Iniciativa → Roadmap → Resultado de Transformación
```

Ver detalle completo en [02-traceability-model.md](./02-traceability-model.md).

## 5. Cómo usar este framework

- **Consultores**: siguen los 21 pasos como guion de compromiso (engagement), fase por
  fase, usando las plantillas/entregables definidos en
  [01-methodology-horizons.md](./01-methodology-horizons.md).
- **Clientes**: ven su progreso de madurez, decisiones y business case en cada fase,
  con trazabilidad completa hacia la estrategia original.
- **AETP (la plataforma)**: es el repositorio vivo que conecta cada artefacto (madurez,
  gaps, capacidades, procesos, oportunidades, iniciativas, roadmap) y calcula el estado
  de avance hacia la Empresa Autónoma.
