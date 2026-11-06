import { fontFamilyForWeight } from '@/constants/Typography';
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
} from 'react-native';

// Drop-in replacements for react-native's Text/TextInput that render in Poppins: they pick the
// right Poppins file for the style's fontWeight, unless the style sets its own fontFamily.
function withPoppins(style: TextProps['style']) {
  const flat = StyleSheet.flatten(style) || {};
  if (flat.fontFamily) return style;
  return [style, { fontFamily: fontFamilyForWeight(flat.fontWeight), fontWeight: 'normal' as const }];
}

export const Text = forwardRef<RNText, TextProps>((props, ref) => (
  <RNText ref={ref} {...props} style={withPoppins(props.style)} />
));
Text.displayName = 'Text';

export const TextInput = forwardRef<RNTextInput, TextInputProps>((props, ref) => (
  <RNTextInput ref={ref} {...props} style={withPoppins(props.style)} />
));
TextInput.displayName = 'TextInput';

// Lets screens keep writing `useRef<TextInput>(null)` after importing TextInput from here.
export type TextInput = RNTextInput;
