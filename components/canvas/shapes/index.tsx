import { Shape } from "@/redux/slice/shapes";
import { Rectangle } from "./rectangle";
import { Stroke } from "./stroke";
import { Line } from "./line";
import { Arrow } from "./arrow";
import { Elipse } from "./elipse";
import { Text } from "./text";
import { Frame } from "./frame";

const ShapeRenderer = ({
    shape,
    toggleInspiration,
    toggleChat,
    generateWorkflow,
    exportDesign
  }:{
    shape: Shape;
    toggleInspiration: () => void;
    toggleChat: (generatedUIId: string) => void;
    generateWorkflow: (generatedUIId: string) => void;
    exportDesign: (generatedUIId: string, element: HTMLElement) => void;
  }) => {

    switch (shape.type) {
        case 'frame':
          return <Frame shape={shape} toggleInspiration={toggleInspiration} />;
        case 'rect':
          return <Rectangle shape={shape} />;
        case 'ellipse':
          return <Elipse shape={shape} />;
        case 'freedraw':
          return <Stroke shape={shape} />;
        case 'arrow':
          return <Arrow shape={shape} />;
        case 'line':
          return <Line shape={shape} />;
        case 'text':
          return <Text shape={shape} />;
        default:
          return null;
      }
      
  };
  

export default ShapeRenderer;