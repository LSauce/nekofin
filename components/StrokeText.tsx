import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';

type StrokeTextProps = {
  text: string;
  style: StyleProp<TextStyle>;
  strokeColor?: string;
  strokeWidth?: number;
};

const StrokeText = ({ text, style, strokeColor = '#000', strokeWidth = 0.7 }: StrokeTextProps) => {
  const offsets = [
    { x: -strokeWidth, y: 0 },
    { x: strokeWidth, y: 0 },
    { x: 0, y: -strokeWidth },
    { x: 0, y: strokeWidth },
    { x: -strokeWidth, y: -strokeWidth },
    { x: strokeWidth, y: -strokeWidth },
    { x: -strokeWidth, y: strokeWidth },
    { x: strokeWidth, y: strokeWidth },
  ];

  return (
    <View style={{ position: 'relative' }}>
      {offsets.map((o, i) => (
        <Text
          key={i}
          style={[
            style,
            {
              color: strokeColor,
              position: 'absolute',
              left: o.x,
              top: o.y,
            },
          ]}
          numberOfLines={1}
        >
          {text}
        </Text>
      ))}
      <Text style={style} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

export default StrokeText;
