import { StyleSheet, Text, View } from 'react-native';

export default function BillsScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Contas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});

