use itertools::interleave;

pub fn temp() {
    for elt in interleave(&[1, 2, 3], &[2, 3, 4]) {
        println!("{}", elt);
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
