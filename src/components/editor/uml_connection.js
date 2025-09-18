// src/components/uml/UMLConnection.js - Componente para Conexiones/Relaciones UML
import React from 'react';
import { useUML, UML_RELATIONSHIP_TYPES } from '../../context/UMLcontext';

const UMLConnection = ({
  connection,
  isSelected,
  onSelect,
  sourceElement,
  targetElement
}) => {
  const { deleteConnection } = useUML();

  // Si no hay conexión, no renderizar nada
  if (!connection) {
    return null;
  }
  
  // Intentar obtener los elementos de la conexión
  const source = sourceElement || connection.sourceElement;
  const target = targetElement || connection.targetElement;
  
  // Si no hay elementos origen o destino, no renderizar
  if (!source || !target) {
    console.warn('UMLConnection: No se encontraron elementos origen o destino:', {
      connectionId: connection._id,
      sourceElementId: connection.sourceElementId || connection.sourceId,
      targetElementId: connection.targetElementId || connection.targetId,
      sourceElement: connection.sourceElement,
      targetElement: connection.targetElement,
      source: source,
      target: target
    });
    return null;
  }

  const { type, properties, styles, sourceMultiplicity, targetMultiplicity, label, role } = connection;

  // Calcular posiciones de conexión
  const calculateConnectionPoints = () => {
    const sourceRect = {
      x: source.position.x,
      y: source.position.y,
      width: source.size.width,
      height: source.size.height
    };

    const targetRect = {
      x: target.position.x,
      y: target.position.y,
      width: target.size.width,
      height: target.size.height
    };

    // Calcular centro de cada elemento
    const sourceCenter = {
      x: sourceRect.x + sourceRect.width / 2,
      y: sourceRect.y + sourceRect.height / 2
    };

    const targetCenter = {
      x: targetRect.x + targetRect.width / 2,
      y: targetRect.y + targetRect.height / 2
    };

    // Calcular puntos de conexión en los bordes
    const sourcePoint = calculateBorderPoint(sourceRect, targetCenter);
    const targetPoint = calculateBorderPoint(targetRect, sourceCenter);

    return { sourcePoint, targetPoint, sourceCenter, targetCenter };
  };

  const calculateBorderPoint = (rect, targetPoint) => {
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    const dx = targetPoint.x - centerX;
    const dy = targetPoint.y - centerY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let borderPoint;

    if (absDx > absDy) {
      // Conexión horizontal
      if (dx > 0) {
        // Lado derecho
        borderPoint = { x: rect.x + rect.width, y: centerY };
      } else {
        // Lado izquierdo
        borderPoint = { x: rect.x, y: centerY };
      }
    } else {
      // Conexión vertical
      if (dy > 0) {
        // Lado inferior
        borderPoint = { x: centerX, y: rect.y + rect.height };
      } else {
        // Lado superior
        borderPoint = { x: centerX, y: rect.y };
      }
    }

    return borderPoint;
  };

  const { sourcePoint, targetPoint } = calculateConnectionPoints();

  // Configuración de estilos según el tipo de relación
  const getConnectionStyle = () => {
    const baseStyle = {
      stroke: styles?.lineColor || '#000000',
      strokeWidth: styles?.lineWidth || 1,
      fill: 'none'
    };

    switch (type) {
      case UML_RELATIONSHIP_TYPES.INHERITANCE:
        return {
          ...baseStyle,
          strokeDasharray: 'none',
          markerEnd: 'url(#triangle-empty)'
        };

      case UML_RELATIONSHIP_TYPES.REALIZATION:
        return {
          ...baseStyle,
          strokeDasharray: '5,5',
          markerEnd: 'url(#triangle-empty)'
        };

      case UML_RELATIONSHIP_TYPES.ASSOCIATION:
        return {
          ...baseStyle,
          strokeDasharray: 'none',
          markerEnd: properties?.bidirectional ? 'url(#arrow-both)' : 'url(#arrow)'
        };

      case UML_RELATIONSHIP_TYPES.AGGREGATION:
        return {
          ...baseStyle,
          strokeDasharray: 'none',
          markerStart: 'url(#diamond-empty)',
          markerEnd: 'url(#arrow)'
        };

      case UML_RELATIONSHIP_TYPES.COMPOSITION:
        return {
          ...baseStyle,
          strokeDasharray: 'none',
          markerStart: 'url(#diamond-filled)',
          markerEnd: 'url(#arrow)'
        };

      case UML_RELATIONSHIP_TYPES.DEPENDENCY:
        return {
          ...baseStyle,
          strokeDasharray: '5,5',
          markerEnd: 'url(#arrow)'
        };

      case UML_RELATIONSHIP_TYPES.USE:
      case UML_RELATIONSHIP_TYPES.INCLUDE:
      case UML_RELATIONSHIP_TYPES.EXTEND:
        return {
          ...baseStyle,
          strokeDasharray: '5,5',
          markerEnd: 'url(#arrow)'
        };

      // Estilos para relaciones de cardinalidad
      case 'one-to-one':
        return {
          ...baseStyle,
          stroke: '#4CAF50',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'url(#arrow)'
        };

      case 'one-to-many':
        return {
          ...baseStyle,
          stroke: '#2196F3',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'url(#arrow)'
        };

      case 'many-to-one':
        return {
          ...baseStyle,
          stroke: '#FF9800',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'url(#arrow)'
        };

      case 'many-to-many':
        return {
          ...baseStyle,
          stroke: '#9C27B0',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'url(#arrow)'
        };

      case 'zero-to-one':
        return {
          ...baseStyle,
          stroke: '#607D8B',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          markerEnd: 'url(#arrow)'
        };

      case 'zero-to-many':
        return {
          ...baseStyle,
          stroke: '#795548',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          markerEnd: 'url(#arrow)'
        };

      case 'one-or-many':
        return {
          ...baseStyle,
          stroke: '#E91E63',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'url(#arrow)'
        };

      case 'intermediate-table':
        return {
          ...baseStyle,
          stroke: '#FF6B35',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'none'  // Sin flecha - solo línea
        };

      case 'intermediate-table-connection':
        return {
          ...baseStyle,
          stroke: '#FF6B35',
          strokeWidth: 2,
          strokeDasharray: 'none',
          markerEnd: 'none'  // Sin flecha - solo línea
        };

      default:
        return baseStyle;
    }
  };

  const connectionStyle = getConnectionStyle();

  // Calcular posición para las etiquetas
  const midPoint = {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(connection._id, connection);
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Aquí podrías abrir un editor de propiedades de la conexión
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres eliminar esta conexión?')) {
      try {
        console.log('Eliminando conexión:', connection._id);
        // Asegurarse de que la conexión tenga un ID válido
        if (!connection._id) {
          throw new Error('ID de conexión no válido');
        }
        await deleteConnection(connection._id);
        console.log('Conexión eliminada exitosamente');
      } catch (error) {
        console.error('Error al eliminar conexión:', error);
        alert('Error al eliminar conexión: ' + (error.message || 'Error desconocido'));
      }
    }
  };

  return (
    <g className={`uml-connection ${isSelected ? 'selected' : ''}`}>
      {/* Definir marcadores SVG */}
      <defs>
        {/* Flecha normal */}
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="black" />
        </marker>

        {/* Triángulo vacío (herencia) */}
        <marker
          id="triangle-empty"
          viewBox="0 0 10 10"
          refX="9"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="white" stroke="black" strokeWidth="1" />
        </marker>

        {/* Diamante vacío (agregación) */}
        <marker
          id="diamond-empty"
          viewBox="0 0 10 6"
          refX="0"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,3 L5,0 L10,3 L5,6 z" fill="white" stroke="black" strokeWidth="1" />
        </marker>

        {/* Diamante relleno (composición) */}
        <marker
          id="diamond-filled"
          viewBox="0 0 10 6"
          refX="0"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,3 L5,0 L10,3 L5,6 z" fill="black" />
        </marker>
      </defs>

      {/* Línea de conexión */}
      <line
        x1={sourcePoint.x}
        y1={sourcePoint.y}
        x2={targetPoint.x}
        y2={targetPoint.y}
        style={connectionStyle}
        className={`connection-line ${type}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Línea invisible para mejor selección */}
      <line
        x1={sourcePoint.x}
        y1={sourcePoint.y}
        x2={targetPoint.x}
        y2={targetPoint.y}
        stroke="transparent"
        strokeWidth="10"
        className="connection-hitbox"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Etiquetas */}
      {(properties?.name || label) && (
        <text
          x={midPoint.x}
          y={midPoint.y - 10}
          textAnchor="middle"
          className="connection-label"
          fontSize="10"
          fill="#333"
        >
          {label || properties?.name || ''}
        </text>
      )}

      {properties?.stereotype && (
        <text
          x={midPoint.x}
          y={midPoint.y + 5}
          textAnchor="middle"
          className="connection-stereotype"
          fontSize="8"
          fill="#666"
          fontStyle="italic"
        >
          «{properties.stereotype}»
        </text>
      )}

      {/* Multiplicidades - Mejorar visualización para relaciones de cardinalidad */}
      {(sourceMultiplicity || properties?.sourceMultiplicity) && (
        <text
          x={sourcePoint.x + 15}
          y={sourcePoint.y - 5}
          textAnchor="start"
          className="multiplicity-label"
          fontSize="10"
          fontWeight="bold"
          fill="#333"
        >
          {sourceMultiplicity || properties?.sourceMultiplicity}
        </text>
      )}

      {(targetMultiplicity || properties?.targetMultiplicity) && (
        <text
          x={targetPoint.x - 15}
          y={targetPoint.y - 5}
          textAnchor="end"
          className="multiplicity-label"
          fontSize="10"
          fontWeight="bold"
          fill="#333"
        >
          {targetMultiplicity || properties?.targetMultiplicity}
        </text>
      )}

      {/* Cardinalidad central para relaciones especiales */}
      {(type === 'one-to-one' || type === 'one-to-many' || type === 'many-to-one' || 
        type === 'many-to-many' || type === 'zero-to-one' || type === 'zero-to-many' || 
        type === 'one-or-many') && (
        <text
          x={(sourcePoint.x + targetPoint.x) / 2}
          y={(sourcePoint.y + targetPoint.y) / 2 - 10}
          textAnchor="middle"
          className="cardinality-label"
          fontSize="9"
          fontWeight="bold"
          fill="#666"
        >
          {type.replace('-', ' a ')}
        </text>
      )}

      {/* Indicador especial para tabla intermedia */}
      {type === 'intermediate-table' && (
        <text
          x={(sourcePoint.x + targetPoint.x) / 2}
          y={(sourcePoint.y + targetPoint.y) / 2 - 10}
          textAnchor="middle"
          className="intermediate-table-label"
          fontSize="9"
          fontWeight="bold"
          fill="#FF6B35"
        >
          Tabla Intermedia
        </text>
      )}
      
      {/* Roles */}
      {(role || properties?.sourceRole) && (
        <text
          x={sourcePoint.x + 15}
          y={sourcePoint.y + 15}
          textAnchor="start"
          className="role-label"
          fontSize="8"
          fontStyle="italic"
          fill="#666"
        >
          {role || properties?.sourceRole || ''}
        </text>
      )}
      
      {properties?.targetRole && (
        <text
          x={targetPoint.x - 15}
          y={targetPoint.y + 15}
          textAnchor="end"
          className="role-label"
          fontSize="8"
          fontStyle="italic"
          fill="#666"
        >
          {properties.targetRole}
        </text>
      )}

      {/* Botones de acción cuando está seleccionada */}
      {isSelected && (
        <g className="connection-controls">
          {/* Botón de eliminar */}
          <circle
            cx={midPoint.x}
            cy={midPoint.y}
            r="10"
            fill="red"
            className="delete-button"
            onClick={handleDelete}
            style={{ cursor: 'pointer' }}
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x={midPoint.x}
            y={midPoint.y + 4}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="white"
            onClick={handleDelete}
            style={{ cursor: 'pointer', pointerEvents: 'none' }}
          >
            ×
          </text>
          
          {/* Etiqueta de ayuda */}
          <rect
            x={midPoint.x + 15}
            y={midPoint.y - 10}
            width="60"
            height="20"
            rx="5"
            ry="5"
            fill="rgba(0,0,0,0.7)"
          />
          <text
            x={midPoint.x + 45}
            y={midPoint.y + 4}
            textAnchor="middle"
            fontSize="10"
            fill="white"
          >
            Eliminar
          </text>
        </g>
      )}
    </g>
  );
};

export default UMLConnection;