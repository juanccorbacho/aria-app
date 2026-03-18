import { StyleSheet, Text, View } from 'react-native';

export default function TransactionsScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Transações</Text>
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

